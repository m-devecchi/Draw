"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
}: {
  drawingId: string;
  kind: "svg" | "raster";
  content: string;
  initialFills: Fills;
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
    [drawingId, kind]
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

  return (
    <div className="space-y-4">
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

      <ColorPalette selected={color} onSelect={setColor} />

      <div className="flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={handleUndo}
          className="rounded-full bg-white px-5 py-2 font-extrabold shadow transition active:scale-95"
        >
          ↩️ Annulla
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="rounded-full bg-white px-5 py-2 font-extrabold shadow transition active:scale-95"
        >
          🧼 Ricomincia
        </button>
        <button
          type="button"
          onClick={handleDownload}
          className="rounded-full bg-crayon-blue px-5 py-2 font-extrabold text-white shadow transition active:scale-95"
        >
          ⬇️ Scarica
        </button>
      </div>

      {kind === "svg" && (
        <p className="text-center text-xs text-stone-400">
          {saveState === "saving"
            ? "Salvataggio..."
            : saveState === "saved"
              ? "Salvato ✓"
              : "Tocca un'area per colorarla"}
        </p>
      )}
    </div>
  );
}
