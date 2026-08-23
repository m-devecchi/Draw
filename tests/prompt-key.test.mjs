// La normalizzazione decide quando due richieste sono "la stessa cosa":
// se sbaglia, o si paga due volte lo stesso disegno, o se ne serve uno
// sbagliato. Vale la pena provarla con cura.
import assert from "node:assert/strict";
import { normalizePrompt, isReusable } from "../src/lib/prompt-key.ts";

const casi = [
  // stessa richiesta scritta in modi diversi
  ["Un dinosauro felice", "dinosauro felice"],
  ["un  DINOSAURO   felice!", "dinosauro felice"],
  ["Il dinosauro felice.", "dinosauro felice"],
  ["dinosauro felice", "dinosauro felice"],
  // accenti e punteggiatura
  ["Una città incantata", "citta incantata"],
  ["un'astronave", "astronave"],
  // l'articolo non si mangia se è tutta la richiesta
  ["gatto", "gatto"],
  // soggetti diversi restano diversi
  ["un gatto nero", "gatto nero"],
];

for (const [input, atteso] of casi) {
  assert.equal(normalizePrompt(input), atteso, `normalizzando "${input}"`);
}

// Richieste diverse NON devono collassare sulla stessa chiave
assert.notEqual(normalizePrompt("un gatto"), normalizePrompt("un cane"));
assert.notEqual(
  normalizePrompt("un gatto nero"),
  normalizePrompt("un gatto bianco")
);

assert.equal(isReusable(normalizePrompt("un gatto")), true);
assert.equal(isReusable(""), false);
assert.equal(isReusable("a".repeat(200)), false);

console.log(`✓ normalizzazione delle richieste: ${casi.length + 5} controlli`);
