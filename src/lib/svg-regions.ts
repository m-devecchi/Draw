// Regole delle aree colorabili, condivise tra la coloritura a schermo
// intero e le anteprime della galleria: gli indici DEVONO coincidere,
// altrimenti un disegno si mostrerebbe con i colori nei posti sbagliati.

import { decodeFill, paintValue } from "./paint";

export const SHAPE_SELECTOR = "path, circle, ellipse, rect, polygon";

export function isColorable(el: SVGElement): boolean {
  const fill = el.getAttribute("fill");
  // Colorabile = forma con un riempimento esplicito diverso da "none"
  // (le linee decorative hanno fill="none").
  return fill !== null && fill.toLowerCase() !== "none";
}

/**
 * Indicizza le aree colorabili dell'SVG contenuto in `container`,
 * aggiungendo se serve uno sfondo colorabile (i disegni generati spesso
 * non hanno fondale, ma i bambini vogliono colorare anche il cielo).
 *
 * Lo sfondo viene inserito per primo nel documento (sta dietro a tutto)
 * ma indicizzato per ULTIMO: così gli indici delle aree già salvate non
 * si spostano.
 *
 * @returns il numero di aree colorabili.
 */
export function indexRegions(container: HTMLElement): number {
  const svg = container.querySelector("svg");
  let background: SVGElement | null = null;
  const vb = svg?.viewBox?.baseVal;

  if (svg && vb && vb.width > 0 && vb.height > 0) {
    const first = svg.querySelector<SVGElement>(SHAPE_SELECTOR);
    const alreadyHasBackground =
      first instanceof SVGRectElement &&
      Number(first.getAttribute("width")) >= vb.width &&
      Number(first.getAttribute("height")) >= vb.height;
    if (!alreadyHasBackground) {
      background = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "rect"
      );
      background.setAttribute("x", String(vb.x));
      background.setAttribute("y", String(vb.y));
      background.setAttribute("width", String(vb.width));
      background.setAttribute("height", String(vb.height));
      background.setAttribute("fill", "#FFFFFF");
      svg.insertBefore(background, svg.firstChild);
    }
  }

  let index = 0;
  container.querySelectorAll<SVGElement>(SHAPE_SELECTOR).forEach((el) => {
    if (el === background) return; // indicizzato in coda
    if (isColorable(el)) {
      el.setAttribute("data-colorable", "1");
      el.setAttribute("data-region", String(index));
      index += 1;
    }
  });
  if (background) {
    background.setAttribute("data-colorable", "1");
    background.setAttribute("data-region", String(index));
    index += 1;
  }
  return index;
}

/**
 * Applica la mappa indice → riempimento alle aree indicizzate.
 * Il valore può essere un semplice colore ("#ff5c5c") oppure portare un
 * effetto ("#ff5c5c:gradient"): in quel caso la definizione viene creata
 * al volo dentro l'SVG.
 */
export function applyFills(
  container: HTMLElement,
  fills: Record<string, string>
) {
  const svg = container.querySelector("svg");
  container
    .querySelectorAll<SVGElement>("[data-colorable='1']")
    .forEach((el) => {
      const region = el.getAttribute("data-region")!;
      const value = fills[region];
      if (!value) {
        el.setAttribute("fill", "#ffffff");
        return;
      }
      const { color, effect } = decodeFill(value);
      el.setAttribute(
        "fill",
        svg ? paintValue(svg, color, effect) : color
      );
    });
}
