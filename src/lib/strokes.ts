// Tratti a mano libera: memorizzati con chiavi corte perché finiscono
// in JSON e possono essere tanti.
export interface Stroke {
  /** Percorso SVG in coordinate del viewBox del disegno. */
  d: string;
  /** Colore del tratto. */
  c: string;
  /** Spessore. */
  w: number;
}

export function isStroke(value: unknown): value is Stroke {
  if (typeof value !== "object" || value === null) return false;
  const s = value as Record<string, unknown>;
  return (
    typeof s.d === "string" &&
    typeof s.c === "string" &&
    typeof s.w === "number"
  );
}

export function parseStrokes(value: unknown): Stroke[] {
  return Array.isArray(value) ? value.filter(isStroke) : [];
}
