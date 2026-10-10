"use client";

import { useEffect, useRef } from "react";
import { applyFills, indexRegions } from "@/lib/svg-regions";
import type { Stroke } from "@/lib/strokes";
import { refineLines } from "@/lib/refine-lines";

/**
 * Anteprima del disegno con i colori applicati.
 * Usa le stesse regole della coloritura (modulo svg-regions), quindi
 * l'anteprima mostra esattamente ciò che il bambino ha colorato.
 */
export function DrawingThumb({
  content,
  fills,
  strokes = [],
}: {
  content: string;
  fills: Record<string, string>;
  strokes?: Stroke[];
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;
    container.innerHTML = refineLines(content);
    indexRegions(container);
    applyFills(container, fills);

    // Anche i tratti a mano libera fanno parte del disegno.
    const svg = container.querySelector("svg");
    if (svg && strokes.length) {
      const NS = "http://www.w3.org/2000/svg";
      for (const stroke of strokes) {
        const path = document.createElementNS(NS, "path");
        path.setAttribute("d", stroke.d);
        path.setAttribute("stroke", stroke.c);
        path.setAttribute("stroke-width", String(stroke.w));
        path.setAttribute("fill", "none");
        path.setAttribute("stroke-linecap", "round");
        path.setAttribute("stroke-linejoin", "round");
        svg.appendChild(path);
      }
    }
  }, [content, fills, strokes]);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="coloring-svg pointer-events-none aspect-square overflow-hidden bg-white"
    />
  );
}
