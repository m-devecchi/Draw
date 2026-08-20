"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { demoStore } from "@/lib/demo-store";
import { ColorPalette } from "./ColorPalette";
import { ERASER, PALETTE } from "./palette";
import { FloodFillCanvas, type FloodFillHandle } from "./FloodFillCanvas";
import { SvgColoring, type SvgColoringHandle } from "./SvgColoring";

type Fills = Record<string, string>;

export function ColoringWorkspace({
  drawingId,
  kind,
  content,
  initialFills,
  mode = "cloud",
  prompt,
}: {
  drawingId: string;
  kind: "svg" | "raster";
  content: string;
  initialFills: Fills;
  /** "cloud": salvataggio su API/DB. "demo" (PoC): salvataggio in localStorage. */
  mode?: "cloud" | "demo";
  /** Titolo del disegno mostrato nella barra in alto. */
  prompt?: string;
}) {
  const [color, setColor] = useState<string>(PALETTE[0]);
  const [fills, setFills] = useState<Fills>(initialFills);
  const [history, setHistory] = useState<Fills[]>([]);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">(
    "idle"
  );

  const svgRef = useRef<SvgColoringHandle>(null);
  const rasterRef = useRef<FloodFillHandle>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const colorRef = useRef(color);
  colorRef.current = color;

  // Salvataggio automatico (solo SVG: i colori sono per-regione).
  const scheduleSave = useCallback(
    (next: Fills) => {
      if (kind !== "svg") return;
      if (mode === "demo") {
        demoStore.saveFills(drawingId, next);
        setSaveState("saved");
        return;
      }
      if (saveTimer.current) clearTimeout(saveTimer.current);
      setSaveState("saving");
      saveTimer.current = setTimeout(async () => {
        try {
          await fetch(`/api/drawings/${drawingId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fills: next }),
          });
          setSaveState("saved");
        } catch {
          setSaveState("idle");
        }
      }, 800);
    },
    [drawingId, kind, mode]
  );

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  const handleRegionTap = useCallback(
    (region: number) => {
      setFills((prev) => {
        const chosen = colorRef.current;
        const next: Fills = { ...prev };
        if (chosen === ERASER) {
          delete next[String(region)];
        } else {
          next[String(region)] = chosen;
        }
        setHistory((h) => [...h.slice(-19), prev]);
        scheduleSave(next);
        return next;
      });
    },
    [scheduleSave]
  );

  function handleUndo() {
    if (kind === "raster") {
      rasterRef.current?.undo();
      return;
    }
    setHistory((h) => {
      if (!h.length) return h;
      const prev = h[h.length - 1];
      setFills(prev);
      scheduleSave(prev);
      return h.slice(0, -1);
    });
  }

  function handleReset() {
    if (kind === "raster") {
      rasterRef.current?.reset();
      return;
    }
    setHistory((h) => [...h.slice(-19), fills]);
    setFills({});
    scheduleSave({});
  }

  async function handleDownload() {
    try {
      const dataUrl =
        kind === "svg"
          ? await svgRef.current?.exportPng()
          : await rasterRef.current?.exportPng();
      if (!dataUrl) return;
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = "colora.png";
      a.click();
    } catch {
      // download non disponibile: si ignora
    }
  }

  const floatingBtn =
    "pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-xl shadow-lg backdrop-blur transition active:scale-90";

  return (
    <div className="fixed inset-0 overflow-hidden bg-white">
      {/* Disegno a tutto schermo (scorre sotto le barre in sovrapposizione) */}
      <div className="absolute inset-0 flex items-center justify-center">
        {kind === "svg" ? (
          <SvgColoring
            ref={svgRef}
            content={content}
            fills={fills}
            onRegionTap={handleRegionTap}
          />
        ) : (
          <FloodFillCanvas ref={rasterRef} content={content} color={color} />
        )}
      </div>

      {/* Barra in alto: indietro, titolo, azioni */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center gap-2 p-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <Link href="/" aria-label="Torna ai disegni" className={floatingBtn}>
          🏠
        </Link>
        {prompt && (
          <span className="pointer-events-auto max-w-[40vw] truncate rounded-full bg-white/90 px-4 py-2 text-sm font-extrabold text-stone-600 shadow-lg backdrop-blur">
            {prompt}
          </span>
        )}
        {kind === "svg" && saveState !== "idle" && (
          <span
            className="rounded-full bg-white/90 px-3 py-2 text-xs font-bold text-stone-400 shadow-lg backdrop-blur"
            aria-live="polite"
          >
            {saveState === "saving" ? "…" : "✓"}
          </span>
        )}
        <span className="flex-1" />
        <button
          type="button"
          onClick={handleUndo}
          aria-label="Annulla"
          className={floatingBtn}
        >
          ↩️
        </button>
        <button
          type="button"
          onClick={handleReset}
          aria-label="Ricomincia"
          className={floatingBtn}
        >
          🧼
        </button>
        <button
          type="button"
          onClick={handleDownload}
          aria-label="Scarica il disegno"
          className={`${floatingBtn} bg-crayon-blue/90 text-white`}
        >
          ⬇️
        </button>
      </div>

      {/* Palette in sovrapposizione in basso */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <ColorPalette selected={color} onSelect={setColor} />
      </div>
    </div>
  );
}
