// Driver Data API di Aurora: traduzione dei segnaposto, tipi dei parametri
// e attesa quando il cluster (in pausa) si sta risvegliando. Il client AWS
// e' sostituito da un finto: qui si verifica solo cio' che l'app gli chiede.
import assert from "node:assert/strict";
import { RDSDataClient } from "@aws-sdk/client-rds-data";

delete process.env.DATABASE_URL;
process.env.DB_CLUSTER_ARN = "arn:aws:rds:eu-west-1:123:cluster:colora";
process.env.DB_SECRET_ARN = "arn:aws:secretsmanager:eu-west-1:123:secret:x";
process.env.DB_NAME = "colora";
process.env.DB_REGION = "eu-west-1";

const calls = [];
let script = [];
RDSDataClient.prototype.send = async function (command) {
  calls.push(command.input);
  const next = script.shift();
  if (next instanceof Error) throw next;
  return next ?? { formattedRecords: "[]" };
};

const { query } = await import("../src/lib/db/client.ts");

// 1. Segnaposto e tipi dei parametri
script = [{ formattedRecords: JSON.stringify([{ id: "a" }]) }];
const rows = await query(
  "select id from t where a = CAST($1 AS uuid) and b = $2 and c = $3 and d = $4 and e = $5 and f = CAST($6 AS jsonb) and g = $10",
  ["u", 7, 1.5, true, null, { x: 1 }, 0, 0, 0, "dieci"]
);
assert.deepEqual(rows, [{ id: "a" }]);
const c = calls[0];
assert.equal(c.resourceArn, process.env.DB_CLUSTER_ARN);
assert.equal(c.database, "colora");
assert.equal(c.formatRecordsAs, "JSON");
assert.match(c.sql, /CAST\(:p1 AS uuid\).*b = :p2.*c = :p3.*d = :p4.*e = :p5.*CAST\(:p6 AS jsonb\).*g = :p10$/);
assert.deepEqual(c.parameters[0], { name: "p1", value: { stringValue: "u" } });
assert.deepEqual(c.parameters[1], { name: "p2", value: { longValue: 7 } });
assert.deepEqual(c.parameters[2], { name: "p3", value: { doubleValue: 1.5 } });
assert.deepEqual(c.parameters[3], { name: "p4", value: { booleanValue: true } });
assert.deepEqual(c.parameters[4], { name: "p5", value: { isNull: true } });
assert.deepEqual(c.parameters[5], { name: "p6", value: { stringValue: '{"x":1}' } });
assert.deepEqual(c.parameters[9], { name: "p10", value: { stringValue: "dieci" } });

// 2. Nessun risultato (insert/update senza returning)
script = [{}];
assert.deepEqual(await query("update t set a = 1"), []);

// 3. Cluster in pausa: riprova finche' non si sveglia
calls.length = 0;
const resuming = Object.assign(new Error("resuming"), { name: "DatabaseResumingException" });
script = [resuming, resuming, { formattedRecords: '[{"n":1}]' }];
const t0 = Date.now();
const resumed = await query("select 1 as n");
assert.deepEqual(resumed, [{ n: 1 }]);
assert.equal(calls.length, 3, "doveva riprovare due volte");
assert.ok(Date.now() - t0 >= 7000, "doveva aspettare tra un tentativo e l'altro");

// 4. Altri errori: nessun tentativo in piu'
calls.length = 0;
script = [Object.assign(new Error("syntax error"), { name: "BadRequestException" })];
await assert.rejects(query("select"), /syntax error/);
assert.equal(calls.length, 1);

console.log("✓ driver Data API: parametri, risveglio, errori");
