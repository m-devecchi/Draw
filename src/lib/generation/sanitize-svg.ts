// Sanificazione dell'SVG generato prima di salvarlo e servirlo:
// il markup viene iniettato inline nella pagina di coloritura, quindi
// va trattato come input non fidato.

const FORBIDDEN_TAGS =
  /<\s*\/?\s*(script|foreignObject|iframe|embed|object|animate|set|use|image|audio|video|link|meta|style)\b[^>]*>/gi;

const EVENT_ATTRS = /\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi;

const EXTERNAL_REFS = /\s+(?:xlink:)?href\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi;

export function sanitizeSvg(raw: string): string {
  // Estrae il solo elemento <svg>...</svg> (il modello può aggiungere testo attorno).
  const match = raw.match(/<svg[\s\S]*<\/svg>/i);
  if (!match) {
    throw new Error("Nessun elemento <svg> trovato nella risposta del modello");
  }
  let svg = match[0];

  svg = svg.replace(FORBIDDEN_TAGS, "");
  svg = svg.replace(EVENT_ATTRS, "");
  svg = svg.replace(EXTERNAL_REFS, "");
  // Niente javascript: o data: residui negli attributi.
  svg = svg.replace(/(javascript|data)\s*:/gi, "");

  return svg;
}
