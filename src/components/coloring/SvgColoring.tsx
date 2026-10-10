"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import { applyFills, indexRegions } from "@/lib/svg-regions";
import { clientToLocal, spreadFill } from "@/lib/spread-fill";

export interface SvgColoringHandle {
  /** Esporta il disegno colorato come PNG (data URL). */
  exportPng(): Promise<string>;
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
    /** Quante aree colorabili ha il disegno (serve per capire quando è finito). */
    onRegionCount?: (count: number) => void;
  }
>(function SvgColoring({ content, fills, onRegionTap, onRegionCount }, ref) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Monta l'SVG e indicizza le regioni colorabili (una sola volta).
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.innerHTML = content;

    onRegionCount?.(indexRegions(container));
  }, [content, onRegionCount]);

  // Applica i colori correnti alle regioni.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    applyFills(container, fills);
  }, [fills, content]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    function handleTap(e: Event) {
      const target = (e.target as Element).closest?.("[data-colorable='1']");
      if (!target) return;
      // Il colore nuovo si allarga dal punto toccato.
      const me = e as MouseEvent;
      const el = target as SVGGraphicsElement;
      spreadFill(
        el,
        me.clientX || me.clientY
          ? clientToLocal(el, me.clientX, me.clientY)
          : null
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
