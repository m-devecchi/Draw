// Decisioni della cache: quando si riusa un disegno e quando se ne fa uno
// nuovo. Sbagliare qui significa o pagare due volte lo stesso disegno, o
// dare due volte lo stesso identico foglio alla stessa persona.
import assert from "node:assert/strict";
import { findReusable } from "../src/lib/drawing-cache.ts";

// Finto client Supabase: risponde con i dati preparati per ogni tabella.
function fakeAdmin({ templates = [], propri = [], errore = false }) {
  const risposta = (tabella) =>
    tabella === "drawing_templates"
      ? { data: errore ? null : templates, error: errore ? { message: "no table" } : null }
      : { data: propri, error: null };

  return {
    from(tabella) {
      const chain = {
        select: () => chain,
        eq: () => chain,
        in: () => chain,
        then: (resolve) => resolve(risposta(tabella)),
      };
      return chain;
    },
  };
}

const T = (id) => ({ id, content: `<svg>${id}</svg>`, kind: "svg" });

// 1. Nessun disegno simile: si genera
let r = await findReusable(fakeAdmin({ templates: [] }), "u1", "un drago blu", "medium");
assert.equal(r.template, null);
assert.equal(r.key, "drago blu");

// 2. Esiste ed è di un altro: si riusa (nessuna chiamata al modello)
r = await findReusable(fakeAdmin({ templates: [T("a")] }), "u1", "Un drago blu!", "medium");
assert.equal(r.template?.id, "a", "doveva riusare il disegno esistente");

// 3. L'utente ha già l'unica variante: se ne disegna una nuova, per non
//    dargli due volte lo stesso foglio
r = await findReusable(
  fakeAdmin({ templates: [T("a")], propri: [{ template_id: "a" }] }),
  "u1", "un drago blu", "medium"
);
assert.equal(r.template, null, "doveva generare una variante nuova");

// 4. Ha già tutte e tre le varianti: tetto raggiunto, si riusa comunque
r = await findReusable(
  fakeAdmin({
    templates: [T("a"), T("b"), T("c")],
    propri: [{ template_id: "a" }, { template_id: "b" }, { template_id: "c" }],
  }),
  "u1", "un drago blu", "medium"
);
assert.ok(["a", "b", "c"].includes(r.template?.id), "doveva riusare, non generare");

// 5. Tabella non ancora creata (migrazione non applicata): si genera
r = await findReusable(fakeAdmin({ errore: true }), "u1", "un drago blu", "medium");
assert.equal(r.template, null, "senza tabella deve solo generare, non rompere");

// 6. Richiesta troppo corta: non si riusa nulla
r = await findReusable(fakeAdmin({ templates: [T("a")] }), "u1", "a", "medium");
assert.equal(r.key, null);
assert.equal(r.template, null);

// 7. Fasce d'età diverse non si mescolano: la chiave è la stessa ma la
//    query filtra per età (qui il finto DB restituisce vuoto)
r = await findReusable(fakeAdmin({ templates: [] }), "u1", "un drago blu", "small");
assert.equal(r.template, null);

console.log("✓ decisioni della cache: 7 scenari");
