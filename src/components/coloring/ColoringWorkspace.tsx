"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { demoStore } from "@/lib/demo-store";
import { parseStrokes, type Stroke } from "@/lib/strokes";
import { encodeFill, type Effect } from "@/lib/paint";
import { ageSetup } from "@/lib/age-bands";
import {
  isMuted,
  playComplete,
  playErase,
  playFill,
  resumeAudio,
  setMuted,
  unlockAudio,
} from "@/lib/sounds";
import { ColorPalette } from "./ColorPalette";
import { FreehandLayer } from "./FreehandLayer";
import { Confetti } from "./Confetti";
import { PinchZoom } from "./PinchZoom";
import { Splash, type SplashHandle } from "./Splash";
import { ERASER } from "./palette";
import { FloodFillCanvas, type FloodFillHandle } from "./FloodFillCanvas";
import { SvgColoring, type SvgColoringHandle } from "./SvgColoring";

type Fills = Record<string, string>;

export function ColoringWorkspace({
  drawingId,
  kind,
  content,
  initialFills,
  initialStrokes = [],
  ageBand,
  mode = "cloud",
  prompt,
  backHref = "/",
}: {
  drawingId: string;
  kind: "svg" | "raster";
  content: string;
  initialFills: Fills;
  /** Tratti a mano libera già salvati. */
  initialStrokes?: Stroke[];
  /** Fascia d'età del bambino: decide colori, effetti e strumenti. */
  ageBand?: string | null;
  /** "cloud": salvataggio su API/DB. "demo" (PoC): salvataggio in localStorage. */
  mode?: "cloud" | "demo";
  /** Titolo del disegno mostrato nella barra in alto. */
  prompt?: string;
  /** Destinazione del pulsante casetta (mantiene il bambino selezionato). */
  backHref?: string;
}) {
  const setup = ageSetup(ageBand);
  const freehand = setup.freehand;
  const [color, setColor] = useState<string>(setup.colors[0]);
  const [effect, setEffect] = useState<Effect>("flat");

  const [fills, setFills] = useState<Fills>(initialFills);
  const [strokes, setStrokes] = useState<Stroke[]>(initialStrokes);
  const [tool, setTool] = useState<"fill" | "draw">("fill");
  interface Snapshot {
    fills: Fills;
    strokes: Stroke[];
  }
  // Cronologia unica per colori e tratti: Annulla deve tornare indietro
  // di un gesto qualunque sia stato.
  const [history, setHistory] = useState<Snapshot[]>([]);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">(
    "idle"
  );
  const [regionCount, setRegionCount] = useState(0);
  const [confettiTrigger, setConfettiTrigger] = useState(0);
  const [muted, setMutedState] = useState(false);
  // Evita di rifestaggiare a ogni ritocco di un disegno gia' completato.
  const celebrated = useRef(false);

  useEffect(() => setMutedState(isMuted()), []);

  // L'audio va sbloccato dentro un gesto dell'utente (regola di iOS):
  // il primo tocco sulla pagina lo abilita, i successivi lo risvegliano
  // se il sistema l'ha sospeso.
  useEffect(() => {
    const onGesture = () => {
      unlockAudio();
      resumeAudio();
    };
    document.addEventListener("pointerdown", onGesture);
    return () => document.removeEventListener("pointerdown", onGesture);
  }, []);

  // Il viewBox serve allo strato a mano libera: stesse coordinate del
  // disegno, così i tratti restano al loro posto a ogni zoom.
  const viewBox =
    content.match(/viewBox=["']([^"']+)["']/)?.[1] ?? "0 0 1000 1000";

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
  const splashRef = useRef<SplashHandle>(null);
  // Ultimo punto toccato: lo schizzo di colore parte da lì.
  const lastPointer = useRef<{ x: number; y: number } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const rasterRef = useRef<FloodFillHandle>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const colorRef = useRef(color);
  colorRef.current = color;
  const effectRef = useRef(effect);
  effectRef.current = effect;
  const fillsRef = useRef(fills);
  fillsRef.current = fills;
  const strokesRef = useRef(strokes);
  strokesRef.current = strokes;

  // Salvataggio automatico (solo SVG: i colori sono per-regione).
  const scheduleSave = useCallback(
    (next: Fills, nextStrokes: Stroke[]) => {
      if (kind !== "svg") return;
      if (mode === "demo") {
        demoStore.save(drawingId, next, nextStrokes);
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
            body: JSON.stringify({ fills: next, strokes: nextStrokes }),
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

  const handleStrokeEnd = useCallback(
    (stroke: Stroke) => {
      interacted.current = true;
      const prev = strokesRef.current;
      const next = [...prev, stroke];
      setHistory((h) => [
        ...h.slice(-19),
        { fills: fillsRef.current, strokes: prev },
      ]);
      setStrokes(next);
      playFill(next.length);
      scheduleSave(fillsRef.current, next);
    },
    [scheduleSave]
  );

  function burstAtPointer(color: string, sparkle: boolean) {
    const pt = lastPointer.current;
    const box = rootRef.current?.getBoundingClientRect();
    if (!pt || !box) return;
    splashRef.current?.burst(pt.x - box.left, pt.y - box.top, color, sparkle);
  }

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
        burstAtPointer("#d6d3d1", false);
      } else {
        const painted = encodeFill(chosen, effectRef.current);
        if (next[String(region)] === painted) return; // gia' cosi'
        next[String(region)] = painted;
        playFill(Object.keys(next).length);
        burstAtPointer(chosen, effectRef.current !== "flat");
      }

      setHistory((h) => [
        ...h.slice(-19),
        { fills: prev, strokes: strokesRef.current },
      ]);
      setFills(next);
      scheduleSave(next, strokesRef.current);
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
      setFills(prev.fills);
      setStrokes(prev.strokes);
      scheduleSave(prev.fills, prev.strokes);
      return h.slice(0, -1);
    });
  }

  function handleReset() {
    if (kind === "raster") {
      rasterRef.current?.reset();
      return;
    }
    setHistory((h) => [...h.slice(-19), { fills, strokes }]);
    setFills({});
    setStrokes([]);
    scheduleSave({}, []);
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
    "pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-xl shadow-[0_4px_0_rgba(58,46,42,0.12),0_8px_20px_-6px_rgba(58,46,42,0.35)] ring-1 ring-black/5 backdrop-blur transition hover:-translate-y-0.5 active:translate-y-0.5 active:scale-90";

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 overflow-hidden bg-white"
      onPointerDownCapture={(e) => {
        lastPointer.current = { x: e.clientX, y: e.clientY };
      }}
      onClickCapture={(e) => {
        // Un click "sintetico" (tastiera, test) non ha coordinate utili:
        // si tiene buono solo quello con una posizione vera.
        if (e.clientX || e.clientY) {
          lastPointer.current = { x: e.clientX, y: e.clientY };
        }
      }}
    >
      {/* Disegno a tutto schermo: due dita per lo zoom, trascina per spostare */}
      <PinchZoom panEnabled={tool !== "draw"}>
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
        {kind === "svg" && freehand && (
          <FreehandLayer
            viewBox={viewBox}
            strokes={strokes}
            color={color === ERASER ? "#ffffff" : color}
            width={12}
            active={tool === "draw"}
            onStrokeEnd={handleStrokeEnd}
          />
        )}
      </PinchZoom>

      {/* Coriandoli quando il disegno e' completo */}
      <Confetti trigger={confettiTrigger} />
      <Splash ref={splashRef} />
      {confettiTrigger > 0 && <BravoBanner key={confettiTrigger} />}

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
          <span className="pointer-events-auto max-w-[40vw] truncate rounded-full bg-white/90 px-4 py-2 font-display text-base font-semibold text-stone-600 shadow-lg ring-1 ring-black/5 backdrop-blur">
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
        {kind === "svg" && freehand && (
          <button
            type="button"
            onClick={() => setTool((t) => (t === "fill" ? "draw" : "fill"))}
            aria-label={
              tool === "fill"
                ? "Passa alla mano libera"
                : "Torna a riempire le aree"
            }
            aria-pressed={tool === "draw"}
            className={`${floatingBtn} ${
              tool === "draw" ? "bg-crayon-yellow" : ""
            }`}
          >
            {tool === "fill" ? "🪣" : "✏️"}
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            const next = !muted;
            setMutedState(next);
            setMuted(next);
            // Riattivando si sente subito una nota: riscontro immediato
            // che l'audio del dispositivo funziona davvero.
            if (!next) {
              unlockAudio();
              playFill(0);
            }
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
        <Link
          href={`/print/${drawingId}`}
          aria-label="Stampa il disegno"
          className={floatingBtn}
        >
          🖨️
        </Link>
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
        <ColorPalette
          selected={color}
          onSelect={setColor}
          effect={effect}
          onEffectChange={setEffect}
          effects={setup.effects}
          colors={setup.colors}
          swatchSize={setup.swatchSize}
        />
      </div>
    </div>
  );
}

const BRAVO_WORDS = ["Bravo!", "Che bello!", "Fantastico!", "Capolavoro!"];

// Scritta gigante che salta fuori a disegno finito, poi se ne va da sola.
function BravoBanner() {
  const [word] = useState(
    () => BRAVO_WORDS[Math.floor(Math.random() * BRAVO_WORDS.length)]
  );
  return (
    <div
      aria-live="polite"
      className="bravo-banner pointer-events-none absolute left-1/2 top-1/2 z-30 flex flex-col items-center"
    >
      <span className="text-6xl drop-shadow-lg">🏆</span>
      <span
        className="rainbow-text font-display text-6xl font-bold sm:text-7xl"
        style={{
          WebkitTextStroke: "2px rgba(255,255,255,0.9)",
          filter: "drop-shadow(0 6px 0 rgba(58,46,42,0.18))",
        }}
      >
        {word}
      </span>
    </div>
  );
}
