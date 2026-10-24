// Decisioni della cache: quando si riusa un disegno e quando se ne fa uno
// nuovo. Sbagliare qui significa o pagare due volte lo stesso disegno, o
// dare due volte lo stesso identico foglio alla stessa persona.
import assert from "node:assert/strict";
import { findReusable } from "../src/lib/drawing-cache.ts";

// Finto accesso ai dati: risponde con i dati preparati.
function fakeStore({ templates = [], propri = [], errore = false }) {
  return {
    async findTemplates() {
      if (errore) throw new Error("no table");
      return templates;
    },
    async ownedTemplateIds() {
      return propri;
    },
  };
}

const T = (id) => ({ id, content: `<svg>${id}</svg>`, kind: "svg" });

// 1. Nessun disegno simile: si genera
let r = await findReusable("u1", "un drago blu", "medium", fakeStore({ templates: [] }));
assert.equal(r.template, null);
assert.equal(r.key, "drago blu");

// 2. Esiste ed è di un altro: si riusa (nessuna chiamata al modello)
r = await findReusable("u1", "Un drago blu!", "medium", fakeStore({ templates: [T("a")] }));
assert.equal(r.template?.id, "a", "doveva riusare il disegno esistente");

// 3. L'utente ha già l'unica variante: se ne disegna una nuova, per non
//    dargli due volte lo stesso foglio
r = await findReusable(
  "u1", "un drago blu", "medium",
  fakeStore({ templates: [T("a")], propri: ["a"] })
);
assert.equal(r.template, null, "doveva generare una variante nuova");

// 4. Ha già tutte e tre le varianti: tetto raggiunto, si riusa comunque
r = await findReusable(
  "u1", "un drago blu", "medium",
  fakeStore({
    templates: [T("a"), T("b"), T("c")],
    propri: ["a", "b", "c"],
  })
);
assert.ok(["a", "b", "c"].includes(r.template?.id), "doveva riusare, non generare");

// 5. Database in errore: si genera, senza rompere
r = await findReusable("u1", "un drago blu", "medium", fakeStore({ errore: true }));
assert.equal(r.template, null, "con il DB in errore deve solo generare, non rompere");

// 6. Richiesta troppo corta: non si riusa nulla
r = await findReusable("u1", "a", "medium", fakeStore({ templates: [T("a")] }));
assert.equal(r.key, null);
assert.equal(r.template, null);

// 7. Fasce d'età diverse non si mescolano: la chiave è la stessa ma la
//    query filtra per età (qui il finto DB restituisce vuoto)
r = await findReusable("u1", "un drago blu", "small", fakeStore({ templates: [] }));
assert.equal(r.template, null);

console.log("✓ decisioni della cache: 7 scenari");
