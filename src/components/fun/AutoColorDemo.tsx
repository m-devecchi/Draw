"use client";

import { useEffect, useRef } from "react";
import { indexRegions } from "@/lib/svg-regions";
import { spreadFill } from "@/lib/spread-fill";

const COLORS = [
  "#4cc9f0",
  "#ffd23f",
  "#2ec4a0",
  "#ff5e5b",
  "#8b5cf6",
  "#ff8fcf",
  "#ff9f43",
  "#a8e05f",
];

/**
 * Un disegno che si colora da solo, area dopo area, col colore che si
 * allarga come sotto il dito di un bambino. Mostra in un colpo d'occhio
 * cosa fa l'app. Puramente decorativo.
 */
export function AutoColorDemo({
  content,
  className = "",
}: {
  content: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;
    container.innerHTML = content;
    const count = indexRegions(container);
    const regions = [
      ...container.querySelectorAll<SVGGraphicsElement>("[data-colorable='1']"),
    ];
    if (!count || !regions.length) return;

    // Lo sfondo (indicizzato per ultimo) va per primo: il cielo, poi i
    // dettagli, come farebbe un bambino.
    const order = [regions[regions.length - 1], ...regions.slice(0, -1)];
    const reduced = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (reduced) {
      order.forEach((el, i) =>
        el.setAttribute("fill", COLORS[i % COLORS.length])
      );
      return;
    }

    let step = 0;
    let timer: ReturnType<typeof setTimeout>;
    function next() {
      if (step < order.length) {
        const el = order[step];
        let box: DOMRect | null = null;
        try {
          box = el.getBBox();
        } catch {}
        // Si parte da un punto a caso dentro l'area
        const local = box
          ? {
              x: box.x + box.width * (0.3 + Math.random() * 0.4),
              y: box.y + box.height * (0.3 + Math.random() * 0.4),
            }
          : null;
        spreadFill(el, local, 520);
        el.setAttribute("fill", COLORS[step % COLORS.length]);
        step += 1;
        timer = setTimeout(next, step === 1 ? 700 : 420);
      } else {
        // Pausa per ammirare, poi si ricomincia da un foglio bianco
        timer = setTimeout(() => {
          order.forEach((el) => el.setAttribute("fill", "#ffffff"));
          step = 0;
          timer = setTimeout(next, 600);
        }, 2600);
      }
    }
    timer = setTimeout(next, 900);
    return () => clearTimeout(timer);
  }, [content]);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={`coloring-svg pointer-events-none ${className}`}
    />
  );
}
