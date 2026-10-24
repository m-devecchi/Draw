// Applica db/schema.sql al database indicato dalle variabili d'ambiente
// (Data API: DB_CLUSTER_ARN + DB_SECRET_ARN, oppure DATABASE_URL).
// Una istruzione alla volta, perche' la Data API ne accetta una per chiamata.
// Richiede Node 22+ (--experimental-strip-types, usato da 02-schema.sh).
import { readFileSync } from "node:fs";
import { query } from "../../src/lib/db/client.ts";

const sql = readFileSync(new URL("../../db/schema.sql", import.meta.url), "utf8");

// Toglie i commenti di riga e separa sulle ";" a fine riga (lo schema non
// contiene corpi di funzione, quindi non servono parser piu' furbi).
const statements = sql
  .split("\n")
  .filter((line) => !line.trim().startsWith("--"))
  .join("\n")
  .split(/;\s*(?:\n|$)/)
  .map((s) => s.trim())
  .filter(Boolean);

console.log(`${statements.length} istruzioni da eseguire`);
for (const [i, statement] of statements.entries()) {
  const label = statement.replace(/\s+/g, " ").slice(0, 60);
  await query(statement);
  console.log(`  ${String(i + 1).padStart(2)}/${statements.length} ${label}`);
}
const tables = await query(
  "select table_name from information_schema.tables where table_schema = 'public' order by 1"
);
console.log("Tabelle:", tables.map((t) => t.table_name).join(", "));
process.exit(0);
