// Chiave di riuso dei disegni.
//
// Un disegno da colorare non è personale: "Un dinosauro felice" chiesto da
// due genitori diversi è lo stesso identico foglio. Normalizzando la
// richiesta si riconosce che è già stata disegnata e si riusa, senza
// chiamare (e pagare) il modello.

const ARTICOLI = new Set([
  "un", "uno", "una", "il", "lo", "la", "i", "gli", "le", "l",
  "dei", "degli", "delle", "del", "dello", "della",
]);

/**
 * Riduce la richiesta alla sua sostanza: niente maiuscole, accenti,
 * punteggiatura, spazi doppi né articoli iniziali.
 *
 * "Un Dinosauro Felice!"  → "dinosauro felice"
 * "il  dinosauro felice"  → "dinosauro felice"
 * "Una PRINCIPESSA"       → "principessa"
 */
export function normalizePrompt(prompt: string): string {
  const parole = prompt
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // via gli accenti
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  // Gli articoli iniziali non cambiano il soggetto del disegno.
  while (parole.length > 1 && ARTICOLI.has(parole[0])) {
    parole.shift();
  }
  return parole.join(" ");
}

/** Vale la pena riusare solo richieste sensate (non vuote, non enormi). */
export function isReusable(normalized: string): boolean {
  return normalized.length >= 3 && normalized.length <= 120;
}
