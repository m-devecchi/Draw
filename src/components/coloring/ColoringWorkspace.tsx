"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { demoStore } from "@/lib/demo-store";
import { playComplete, playErase, playFill, isMuted, setMuted } from "@/lib/sounds";
import { ColorPalette } from "./ColorPalette";
import { Confetti } from "./Confetti";
import { PinchZoom } from "./PinchZoom";
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
  backHref = "/",
}: {
  drawingId: string;
  kind: "svg" | "raster";
  content: string;
  initialFills: Fills;
  /** "cloud": salvataggio su API/DB. "demo" (PoC): salvataggio in localStorage. */
  mode?: "cloud" | "demo";
  /** Titolo del disegno mostrato nella barra in alto. */
  prompt?: string;
  /** Destinazione del pulsante casetta (mantiene il bambino selezionato). */
  backHref?: string;
}) {
  const [color, setColor] = useState<string>(PALETTE[0]);
  const [fills, setFills] = useState<Fills>(initialFills);
  const [history, setHistory] = useState<Fills[]>([]);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">(
    "idle"
  );
  const [regionCount, setRegionCount] = useState(0);
  const [confettiTrigger, setConfettiTrigger] = useState(0);
  const [muted, setMutedState] = useState(false);
  // Evita di rifestaggiare a ogni ritocco di un disegno gia' completato.
  const celebrated = useRef(false);

  useEffect(() => setMutedState(isMuted()), []);

  const handleRegionCount = useCallback((count: number) => {
    setRegionCount(count);
    celebrated.current = false;
  }, []);

  // Un disegno gia' completo riaperto dalla galleria non rifesteggia:
  // la festa parte solo dopo che il bambino ha colorato qualcosa.
  const interacted = useRef(false);

  useEffect(() => {
    const complete =
      regionCount > 0 && Object.keys(fills).length >= regionCount;
    if (!complete) {
      celebrated.current = false; // riarmata: 🧼, Annulla o gomma
      return;
    }
    if (celebrated.current || !interacted.current) {
      celebrated.current = true;
      return;
    }
    celebrated.current = true;
    setConfettiTrigger((t) => t + 1);
    playComplete();
  }, [fills, regionCount]);

  const svgRef = useRef<SvgColoringHandle>(null);
  const rasterRef = useRef<FloodFillHandle>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const colorRef = useRef(color);
  colorRef.current = color;
  const fillsRef = useRef(fills);
  fillsRef.current = fills;

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

  // Gli effetti (suoni, coriandoli, cronologia) stanno FUORI dall'updater
  // di setFills: React puo' rieseguire un updater, e una festa doppia o un
  // suono doppio si sentirebbero.
  const handleRegionTap = useCallback(
    (region: number) => {
      const prev = fillsRef.current;
      const chosen = colorRef.current;
      const next: Fills = { ...prev };

      interacted.current = true;
      if (chosen === ERASER) {
        if (next[String(region)] === undefined) return; // gia' bianca
        delete next[String(region)];
        playErase();
      } else {
        if (next[String(region)] === chosen) return; // stesso colore
        next[String(region)] = chosen;
        playFill(Object.keys(next).length);
      }

      setHistory((h) => [...h.slice(-19), prev]);
      setFills(next);
      scheduleSave(next);
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
      {/* Disegno a tutto schermo: due dita per lo zoom, trascina per spostare */}
      <PinchZoom>
        {kind === "svg" ? (
          <SvgColoring
            ref={svgRef}
            content={content}
            fills={fills}
            onRegionTap={handleRegionTap}
            onRegionCount={handleRegionCount}
          />
        ) : (
          <FloodFillCanvas ref={rasterRef} content={content} color={color} />
        )}
      </PinchZoom>

      {/* Coriandoli quando il disegno e' completo */}
      <Confetti trigger={confettiTrigger} />

      {/* Barra in alto: indietro, titolo, azioni */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center gap-2 p-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <Link
          href={backHref}
          aria-label="Torna ai disegni"
          className={floatingBtn}
        >
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
          onClick={() => {
            const next = !muted;
            setMutedState(next);
            setMuted(next);
          }}
          aria-label={muted ? "Riattiva i suoni" : "Silenzia i suoni"}
          aria-pressed={muted}
          className={floatingBtn}
        >
          {muted ? "🔇" : "🔊"}
        </button>
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
