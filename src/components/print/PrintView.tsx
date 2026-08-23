"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { applyFills, indexRegions } from "@/lib/svg-regions";
import type { Stroke } from "@/lib/strokes";

/**
 * Pagina di stampa A4.
 *
 * È il cuore dell'uso su carta: il genitore crea il disegno col telefono,
 * lo stampa, e il bambino colora coi pastelli veri — senza schermo.
 * Di default si stampa in sole linee nere (si risparmia inchiostro e c'è
 * tutto da colorare); volendo si stampa anche già colorato.
 */
export function PrintView({
  content,
  fills,
  strokes = [],
  prompt,
  backHref = "/",
}: {
  content: string;
  fills: Record<string, string>;
  strokes?: Stroke[];
  prompt: string;
  backHref?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [colored, setColored] = useState(false);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;
    container.innerHTML = content;
    indexRegions(container);
    // "Solo linee": tutte le aree tornano bianche.
    applyFills(container, colored ? fills : {});

    const svg = container.querySelector("svg");
    if (svg && colored && strokes.length) {
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
  }, [content, fills, strokes, colored]);

  return (
    <div className="print-page">
      {/* Comandi: non finiscono sulla carta */}
      <div className="no-print sticky top-0 z-10 flex flex-wrap items-center gap-2 bg-stone-50/95 p-3 shadow backdrop-blur">
        <Link
          href={backHref}
          aria-label="Torna ai disegni"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-xl shadow transition active:scale-90"
        >
          🏠
        </Link>
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-full bg-crayon-green px-6 py-3 text-lg font-extrabold text-white shadow-lg transition active:scale-95"
        >
          🖨️ Stampa
        </button>
        <button
          type="button"
          onClick={() => setColored((c) => !c)}
          aria-pressed={colored}
          className={`rounded-full px-4 py-3 text-sm font-bold shadow transition active:scale-95 ${
            colored ? "bg-crayon-yellow" : "bg-white text-stone-500"
          }`}
        >
          {colored ? "🎨 Con i colori" : "✏️ Solo linee"}
        </button>
        <span className="ml-auto text-sm font-semibold text-stone-400">
          Foglio A4
        </span>
      </div>

      {/* Il foglio */}
      <div className="mx-auto my-4 w-full max-w-[820px] px-3">
        <div className="print-sheet rounded-2xl bg-white p-4 shadow-lg">
          <div ref={ref} className="coloring-svg w-full" />
          <p className="print-title mt-2 text-center text-sm font-bold text-stone-400">
            {prompt}
          </p>
        </div>
      </div>
    </div>
  );
}
