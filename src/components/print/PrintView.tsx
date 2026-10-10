"use client";

import { Icon } from "@/components/ui/Icon";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { applyFills, indexRegions } from "@/lib/svg-regions";
import type { Stroke } from "@/lib/strokes";
import { refineLines } from "@/lib/refine-lines";

/**
 * Pagina di stampa A4.
 *
 * È il cuore dell'uso su carta: il genitore crea il disegno col telefono,
 * lo stampa, e il bambino colora coi pastelli veri — senza schermo.
 * Di default si stampa in sole linee nere (si risparmia inchiostro e c'è
 * tutto da colorare); volendo si stampa anche già colorato.
 */
export interface PrintableDrawing {
  id: string;
  prompt: string;
  content: string;
  fills: Record<string, string>;
  strokes?: Stroke[];
}

export function PrintView({
  drawings,
  backHref = "/",
}: {
  drawings: PrintableDrawing[];
  backHref?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [colored, setColored] = useState(false);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    // Ogni foglio è un contenitore indipendente: le aree vengono
    // indicizzate per disegno, come nella coloritura.
    root.querySelectorAll<HTMLElement>("[data-sheet]").forEach((container) => {
      const drawing = drawings.find(
        (d) => d.id === container.getAttribute("data-sheet")
      );
      if (!drawing) return;
      container.innerHTML = refineLines(drawing.content);
      indexRegions(container);
      // "Solo linee": tutte le aree tornano bianche.
      applyFills(container, colored ? drawing.fills : {});

      const svg = container.querySelector("svg");
      if (svg && colored && drawing.strokes?.length) {
        const NS = "http://www.w3.org/2000/svg";
        for (const stroke of drawing.strokes) {
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
    });
  }, [drawings, colored]);

  return (
    <div className="print-page">
      {/* Comandi: non finiscono sulla carta */}
      <div className="no-print sticky top-0 z-10 flex flex-wrap items-center gap-2.5 border-b border-line bg-paper/90 p-3 backdrop-blur">
        <Link
          href={backHref}
          aria-label="Torna ai disegni"
          className="ink-icon-btn"
        >
          <Icon name="home" />
        </Link>
        <button
          type="button"
          onClick={() => window.print()}
          className="ink-btn ink-btn-mint px-6 py-3 text-lg"
        >
          <Icon name="print" />
          Stampa
        </button>
        <button
          type="button"
          onClick={() => setColored((c) => !c)}
          aria-pressed={colored}
          className={`ink-btn px-4 py-3 text-base ${colored ? "ink-btn-sun" : ""}`}
        >
          <Icon name={colored ? "bucket" : "pencil"} className="!h-5 !w-5" />
          {colored ? "Con i colori" : "Solo linee"}
        </button>
        <span className="ml-auto text-sm font-bold text-ink-soft">
          {drawings.length === 1
            ? "Foglio A4"
            : `${drawings.length} fogli A4`}
        </span>
      </div>

      {/* I fogli: uno per disegno, uno per pagina */}
      <div ref={ref} className="print-outer mx-auto my-4 w-full max-w-[820px] px-3">
        {drawings.map((d) => (
          <div
            key={d.id}
            className="print-sheet ink-card mb-5 p-4"
          >
            <div data-sheet={d.id} className="coloring-svg w-full" />
            <p className="print-title mt-2 text-center text-sm font-bold text-ink-soft">
              {d.prompt}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
