import {
  ExecuteStatementCommand,
  RDSDataClient,
  type SqlParameter,
} from "@aws-sdk/client-rds-data";

// Accesso a PostgreSQL con due driver dietro la stessa funzione query():
//
// - Data API di Aurora Serverless v2 (produzione su Amplify): chiamate
//   HTTPS firmate con IAM, niente VPC, niente pool di connessioni, e il
//   cluster non deve essere raggiungibile da Internet.
//   Variabili: DB_CLUSTER_ARN, DB_SECRET_ARN, DB_NAME (e DB_REGION).
// - Connessione diretta con "pg" (sviluppo locale, test): DATABASE_URL.
//
// Le query usano segnaposto $1, $2, ... e CAST espliciti
// (CAST($1 AS uuid), CAST($2 AS jsonb), ...): cosi' lo stesso SQL vale
// per entrambi i driver e i parametri viaggiano sempre come testo.

export type Param =
  | string
  | number
  | boolean
  | null
  | Record<string, unknown>
  | unknown[];

export function isDbConfigured(): boolean {
  return Boolean(
    process.env.DATABASE_URL ||
      (process.env.DB_CLUSTER_ARN && process.env.DB_SECRET_ARN)
  );
}

export async function query<T = Record<string, unknown>>(
  sql: string,
  params: Param[] = []
): Promise<T[]> {
  if (process.env.DATABASE_URL) return queryPg<T>(sql, params);
  return queryDataApi<T>(sql, params);
}

function normalize(p: Param): string | number | boolean | null {
  if (p !== null && typeof p === "object") return JSON.stringify(p);
  return p;
}

// ── Connessione diretta (pg) ────────────────────────────────────────────

type PgPool = {
  query: (sql: string, params: unknown[]) => Promise<{ rows: unknown[] }>;
};
let pool: Promise<PgPool> | null = null;

function getPool(): Promise<PgPool> {
  pool ??= import("pg").then(({ default: pg }) => {
    return new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      ssl:
        process.env.DATABASE_SSL === "true"
          ? { rejectUnauthorized: false }
          : undefined,
      max: 5,
    }) as unknown as PgPool;
  });
  return pool;
}

async function queryPg<T>(sql: string, params: Param[]): Promise<T[]> {
  const p = await getPool();
  const res = await p.query(sql, params.map(normalize));
  return res.rows as T[];
}

// ── Data API di Aurora ──────────────────────────────────────────────────

let dataClient: RDSDataClient | null = null;

function getDataClient(): RDSDataClient {
  dataClient ??= new RDSDataClient({
    region:
      process.env.DB_REGION ??
      process.env.COGNITO_REGION ??
      process.env.AWS_REGION,
  });
  return dataClient;
}

function toSqlParameter(value: Param, index: number): SqlParameter {
  const v = normalize(value);
  const name = `p${index + 1}`;
  if (v === null) return { name, value: { isNull: true } };
  if (typeof v === "boolean") return { name, value: { booleanValue: v } };
  if (typeof v === "number") {
    return {
      name,
      value: Number.isInteger(v) ? { longValue: v } : { doubleValue: v },
    };
  }
  return { name, value: { stringValue: v } };
}

// Il cluster in pausa (scala a zero) risponde "resuming" per una decina di
// secondi dopo la prima richiesta: si riprova finche' non e' sveglio.
function isResuming(err: unknown): boolean {
  const e = err as { name?: string; message?: string };
  return (
    e?.name === "DatabaseResumingException" ||
    /resuming|communications link failure|is not available/i.test(
      e?.message ?? ""
    )
  );
}

const RESUME_ATTEMPTS = 14;
const RESUME_WAIT_MS = 4000;

async function queryDataApi<T>(sql: string, params: Param[]): Promise<T[]> {
  const resourceArn = process.env.DB_CLUSTER_ARN;
  const secretArn = process.env.DB_SECRET_ARN;
  if (!resourceArn || !secretArn) {
    throw new Error(
      "Database non configurato: impostare DB_CLUSTER_ARN e DB_SECRET_ARN (oppure DATABASE_URL)"
    );
  }

  // $1 -> :p1 (Data API usa parametri con nome).
  const named = sql.replace(/\$(\d+)/g, (_, n) => `:p${n}`);
  const command = new ExecuteStatementCommand({
    resourceArn,
    secretArn,
    database: process.env.DB_NAME ?? "colora",
    sql: named,
    parameters: params.map(toSqlParameter),
    formatRecordsAs: "JSON",
  });

  for (let attempt = 1; ; attempt++) {
    try {
      const res = await getDataClient().send(command);
      return res.formattedRecords
        ? (JSON.parse(res.formattedRecords) as T[])
        : [];
    } catch (err) {
      if (attempt >= RESUME_ATTEMPTS || !isResuming(err)) throw err;
      await new Promise((r) => setTimeout(r, RESUME_WAIT_MS));
    }
  }
}

// ── Utilita' ────────────────────────────────────────────────────────────

/** Timestamp in ISO 8601 UTC, uguale su entrambi i driver. */
export function iso(column: string): string {
  return `to_char(${column} at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')`;
}

/** Le colonne jsonb arrivano gia' parsate (pg) o come testo (Data API). */
export function fromJson<T>(value: unknown, fallback: T): T {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  return value as T;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}
