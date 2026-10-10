"use client";

import { useEffect, useRef } from "react";
import { indexRegions } from "@/lib/svg-regions";
import { spreadFill } from "@/lib/spread-fill";
import { refineLines } from "@/lib/refine-lines";

const COLORS = [
  "#a5cae3",
  "#f4d27c",
  "#a6cb8c",
  "#efb2ae",
  "#bba8d8",
  "#efa877",
  "#a6d2c4",
  "#d69bb7",
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
    container.innerHTML = refineLines(content);
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
        spreadFill(el, local, 900);
        el.setAttribute("fill", COLORS[step % COLORS.length]);
        step += 1;
        timer = setTimeout(next, step === 1 ? 900 : 560);
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
