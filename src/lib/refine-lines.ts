// Linee sottili come negli album da colorare giapponesi: i disegni
// arrivano con tratti neri spessi (pensati anche per la stampa), qui si
// assottigliano e diventano color inchiostro sumi solo per lo schermo.
// Funzione pura sulla stringa SVG: vale anche per i disegni già salvati.

export const SUMI = "#4a443f";
const FACTOR = 0.55;
const MIN_WIDTH = 2.5;

export function refineLines(svg: string): string {
  return svg
    .replace(/stroke-width="([\d.]+)"/g, (_, w: string) => {
      const n = Math.max(MIN_WIDTH, Number(w) * FACTOR);
      return `stroke-width="${Math.round(n * 10) / 10}"`;
    })
    .replace(/stroke="(?:#000000|#000|black)"/gi, `stroke="${SUMI}"`)
    .replace(/fill="(?:#000000|#000|black)"/gi, `fill="${SUMI}"`);
}
