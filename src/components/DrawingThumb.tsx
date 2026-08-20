"use client";

import { useEffect, useRef } from "react";
import { applyFills, indexRegions } from "@/lib/svg-regions";

/**
 * Anteprima del disegno con i colori applicati.
 * Usa le stesse regole della coloritura (modulo svg-regions), quindi
 * l'anteprima mostra esattamente ciò che il bambino ha colorato.
 */
export function DrawingThumb({
  content,
  fills,
}: {
  content: string;
  fills: Record<string, string>;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;
    container.innerHTML = content;
    indexRegions(container);
    applyFills(container, fills);
  }, [content, fills]);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="coloring-svg pointer-events-none aspect-square overflow-hidden rounded-2xl bg-white"
    />
  );
}
