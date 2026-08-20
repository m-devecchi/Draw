"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";

export interface SvgColoringHandle {
  /** Esporta il disegno colorato come PNG (data URL). */
  exportPng(): Promise<string>;
}

const SHAPE_SELECTOR = "path, circle, ellipse, rect, polygon";

function isColorable(el: SVGElement): boolean {
  const fill = el.getAttribute("fill");
  // Colorabile = forma con un riempimento esplicito diverso da "none"
  // (le linee decorative hanno fill="none").
  return fill !== null && fill.toLowerCase() !== "none";
}

/**
 * Rende l'SVG (già sanificato lato server) e gestisce il tap-to-fill:
 * ogni forma con un fill esplicito è una regione colorabile, indicizzata
 * in ordine di documento. `fills` mappa indice → colore.
 */
export const SvgColoring = forwardRef<
  SvgColoringHandle,
  {
    content: string;
    fills: Record<string, string>;
    onRegionTap: (regionIndex: number) => void;
  }
>(function SvgColoring({ content, fills, onRegionTap }, ref) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Monta l'SVG e indicizza le regioni colorabili (una sola volta).
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.innerHTML = content;

    // Sfondo colorabile: i disegni generati spesso non hanno un fondale,
    // ma i bambini vogliono colorare anche il cielo. Viene inserito come
    // prima forma (dietro a tutto) e indicizzato per ULTIMO, così gli
    // indici delle regioni già salvate restano stabili.
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

    const shapes = container.querySelectorAll<SVGElement>(SHAPE_SELECTOR);
    let index = 0;
    shapes.forEach((el) => {
      if (el === background) return; // indicizzato in coda, dopo il ciclo
      if (isColorable(el)) {
        el.setAttribute("data-colorable", "1");
        el.setAttribute("data-region", String(index));
        index += 1;
      }
    });
    if (background) {
      background.setAttribute("data-colorable", "1");
      background.setAttribute("data-region", String(index));
    }
  }, [content]);

  // Applica i colori correnti alle regioni.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container
      .querySelectorAll<SVGElement>("[data-colorable='1']")
      .forEach((el) => {
        const region = el.getAttribute("data-region")!;
        el.setAttribute("fill", fills[region] ?? "#ffffff");
      });
  }, [fills, content]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    function handleTap(e: Event) {
      const target = (e.target as Element).closest?.("[data-colorable='1']");
      if (!target) return;
      // Piccolo "pop" della regione toccata, per un feedback giocoso.
      target.classList.remove("region-pop");
      void target.getBoundingClientRect(); // forza il reflow per riavviare l'animazione
      target.classList.add("region-pop");
      target.addEventListener(
        "animationend",
        () => target.classList.remove("region-pop"),
        { once: true }
      );
      onRegionTap(Number(target.getAttribute("data-region")));
    }
    container.addEventListener("click", handleTap);
    return () => container.removeEventListener("click", handleTap);
  }, [onRegionTap]);

  useImperativeHandle(ref, () => ({
    async exportPng() {
      const svgEl = containerRef.current?.querySelector("svg");
      if (!svgEl) throw new Error("SVG non trovato");
      const xml = new XMLSerializer().serializeToString(svgEl);
      const blob = new Blob([xml], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      try {
        const img = new Image();
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error("Render SVG fallito"));
          img.src = url;
        });
        const size = 1200;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d")!;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, size, size);
        ctx.drawImage(img, 0, 0, size, size);
        return canvas.toDataURL("image/png");
      } finally {
        URL.revokeObjectURL(url);
      }
    },
  }));

  return (
    <div
      ref={containerRef}
      className="coloring-svg coloring-svg-fill h-full w-full"
    />
  );
});
