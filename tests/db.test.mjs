import assert from "node:assert/strict";
// Livello dati su un Postgres vero: query, isolamento tra utenti, cascate.
// Si attiva solo con TEST_DATABASE_URL (database di prova con lo schema di
// db/schema.sql già applicato); senza, il test viene saltato.
//   createdb colora_test && psql colora_test -f db/schema.sql
//   TEST_DATABASE_URL=postgres://localhost/colora_test npm test
if (!process.env.TEST_DATABASE_URL) {
  console.log("- test del livello dati saltato (manca TEST_DATABASE_URL)");
  process.exit(0);
}
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;

const r = await import("../src/lib/db/repo.ts");
const { query } = await import("../src/lib/db/client.ts");
const U1 = "11111111-1111-4111-8111-111111111111", U2 = "22222222-2222-4222-8222-222222222222";

// Pulizia di eventuali residui di un'esecuzione precedente
await query("delete from profiles where id in (CAST($1 AS uuid), CAST($2 AS uuid))", [U1, U2]);
await query("delete from drawing_templates where prompt_key = $1", ["drago-test"]);

await r.ensureProfile(U1, "mario@example.com");
await r.ensureProfile(U1, "mario@example.com");
await r.ensureProfile(U2, "anna@example.com");
let p = await r.getProfile(U1);
assert.equal(p.plan, "free"); assert.equal(p.displayName, "mario"); assert.match(p.createdAt, /^\d{4}-\d\d-\d\dT.*Z$/);
await r.ensureProfile(U1, "nuova@example.com");
assert.equal((await r.getProfile(U1)).email, "nuova@example.com");
await r.setDisplayName(U1, "Mario R."); assert.equal((await r.getProfile(U1)).displayName, "Mario R.");
await r.setParentPinHash(U1, "h"); assert.equal((await r.getProfile(U1)).parentPinHash, "h");

const kid = await r.addKid(U1, "Luca", "🦁");
assert.deepEqual((await r.listKids(U1)).map(k=>k.name), ["Luca"]);
assert.equal(await r.kidBelongsTo(U1, kid.id), true);
assert.equal(await r.kidBelongsTo(U2, kid.id), false, "kid di un altro utente");
assert.equal(await r.kidBelongsTo(U1, "non-uuid"), false);

const tid = await r.insertTemplate({ key:"drago-test", prompt:"un drago", ageBand:"medium", provider:"mock", kind:"svg", content:"<svg/>" });
assert.equal((await r.findTemplates("drago-test","medium")).length, 1);
assert.equal((await r.findTemplates("drago-test","small")).length, 0);
const d1 = await r.insertDrawing(U1, { prompt:"un drago", provider:"mock", kind:"svg", content:"<svg>1</svg>", ageBand:"medium", kidId:kid.id, templateId:tid });
const d2 = await r.insertDrawing(U1, { prompt:"altro", provider:"mock", kind:"svg", content:"<svg>2</svg>", ageBand:"big", kidId:null, templateId:null });
assert.deepEqual(await r.ownedTemplateIds(U1,[tid]), [tid]);
assert.deepEqual(await r.ownedTemplateIds(U2,[tid]), []);
await r.bumpTemplateUses(tid);
assert.equal((await query("select uses from drawing_templates where id = CAST($1 AS uuid)", [tid]))[0].uses, 1);

let list = await r.listDrawings(U1);
assert.equal(list.length, 2); assert.equal(list[0].id, d2, "piu' recente per primo");
assert.equal((await r.listDrawings(U1,{kidId:kid.id})).length, 1);
assert.equal((await r.listDrawings(U2)).length, 0, "isolamento: U2 non vede i disegni di U1");
assert.equal(await r.getDrawing(U2, d1), null, "isolamento su getDrawing");
assert.equal(await r.getDrawing(U1, "abc"), null);
assert.equal((await r.getDrawingsByIds(U1,[d1,d2,"x"])).length, 2);
assert.equal((await r.getDrawingsByIds(U2,[d1,d2])).length, 0);
assert.equal(await r.updateDrawing(U2, d1, {fills:{"0":"#ff0000"}}), false, "U2 non puo' modificare");
assert.equal(await r.updateDrawing(U1, d1, {fills:{"0":"#ff0000"}, strokes:[{d:"M 1 1 L 2 2",c:"#000000",w:4}]}), true);
let g = await r.getDrawing(U1, d1);
assert.deepEqual(g.fills, {"0":"#ff0000"}); assert.equal(g.strokes[0].w, 4); assert.equal(g.ageBand,"medium"); assert.equal(g.kidId, kid.id);
await r.updateDrawing(U1, d1, {fills:{}});
assert.equal((await r.getDrawing(U1,d1)).strokes.length, 1, "senza strokes restano quelli esistenti");
assert.equal(await r.countDrawings(U1), 2);

const g1 = await r.insertGeneration(U1,{provider:"mock",prompt:"x",cached:false});
await r.insertGeneration(U1,{provider:"mock",prompt:"y",cached:true});
const since = new Date(Date.UTC(2000,0,1)).toISOString();
assert.equal(await r.countGenerationsSince(U1, since), 2);
assert.equal(await r.countGenerationsSince(U2, since), 0);
assert.equal(await r.countGenerationsSince(U1, new Date(Date.now()+86400000).toISOString()), 0);
await r.deleteGeneration(U2, g1); assert.equal(await r.countGenerationsSince(U1, since), 2, "U2 non cancella");
await r.deleteGeneration(U1, g1); assert.equal(await r.countGenerationsSince(U1, since), 1);

await r.setStripeCustomer(U1,"cus_1");
await r.setPlanByCustomer("cus_1","premium","sub_1");
assert.equal((await r.getProfile(U1)).plan, "premium");

await r.deleteDrawing(U2, d2); assert.equal(await r.countDrawings(U1), 2, "U2 non cancella");
await r.deleteDrawing(U1, d2); assert.equal(await r.countDrawings(U1), 1);
await r.deleteKid(U2, kid.id); assert.equal((await r.listKids(U1)).length, 1);
await r.deleteKid(U1, kid.id);
assert.equal((await r.getDrawing(U1,d1)).kidId, null, "kid cancellato: disegno resta senza bambino");

await r.deleteProfile(U1);
assert.equal(await r.getProfile(U1), null);
assert.equal((await query("select count(*)::int n from drawings where user_id = CAST($1 AS uuid)", [U1]))[0].n, 0, "cascata sui disegni");
assert.equal((await query("select count(*)::int n from generations where user_id = CAST($1 AS uuid)", [U1]))[0].n, 0, "cascata sulle generazioni");
assert.notEqual(await r.getProfile(U2), null);
await r.deleteProfile(U2);
await query("delete from drawing_templates where prompt_key = $1", ["drago-test"]);
console.log("✓ livello dati: tutti i controlli passati");
process.exit(0);
