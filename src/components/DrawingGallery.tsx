"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { DrawingThumb } from "./DrawingThumb";
import { demoStore } from "@/lib/demo-store";
import type { Stroke } from "@/lib/strokes";

// Inclinazioni e colori del nastro: la bacheca sembra fatta a mano.
const TILTS = [-2, 1.5, -1, 2.2, -1.6, 0.8];
const TAPES = [
  "rgba(255,206,62,0.7)",
  "rgba(255,138,212,0.6)",
  "rgba(78,167,255,0.55)",
  "rgba(88,204,109,0.55)",
];

export interface GalleryDrawing {
  id: string;
  prompt: string;
  content: string;
  fills: Record<string, string>;
  strokes: Stroke[];
  createdAt: string;
  /** Avatar del bambino a cui appartiene il disegno. */
  badge?: string;
}

/**
 * Galleria dei disegni con selezione multipla per la stampa.
 *
 * Stampare più disegni in una volta è il gesto naturale del genitore:
 * si preparano quattro fogli e si porta il pacchetto al tavolo, non si
 * torna al telefono a ogni disegno.
 */
export function DrawingGallery({
  drawings,
  mode = "cloud",
  hrefSuffix = "",
  onChanged,
}: {
  drawings: GalleryDrawing[];
  mode?: "cloud" | "demo";
  /** Parametri da mantenere nei link (es. ?kid=...). */
  hrefSuffix?: string;
  /** Solo demo: la home locale ricarica la lista dopo un'eliminazione. */
  onChanged?: () => void;
}) {
  const router = useRouter();
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirming, setConfirming] = useState<string | null>(null);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleDelete(id: string) {
    if (mode === "demo") {
      demoStore.remove(id);
      onChanged?.();
    } else {
      const res = await fetch(`/api/drawings/${id}`, { method: "DELETE" });
      if (res.ok) router.refresh();
    }
    setConfirming(null);
  }

  const selectedIds = [...selected];

  return (
    <div>
      {/* Barra della selezione */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => {
            setSelecting((s) => !s);
            setSelected(new Set());
          }}
          aria-pressed={selecting}
          className={`btn-candy rounded-full px-4 py-2 text-sm font-bold ${
            selecting ? "bg-crayon-yellow" : "bg-white text-stone-500"
          }`}
        >
          {selecting ? "✕ Annulla selezione" : "🖨️ Stampa più disegni"}
        </button>

        {selecting && (
          <>
            <button
              type="button"
              onClick={() =>
                setSelected(
                  selected.size === drawings.length
                    ? new Set()
                    : new Set(drawings.map((d) => d.id))
                )
              }
              className="btn-candy rounded-full bg-white px-4 py-2 text-sm font-bold text-stone-500"
            >
              {selected.size === drawings.length ? "Nessuno" : "Tutti"}
            </button>
            {selectedIds.length > 0 && (
              <Link
                href={`/print/insieme?ids=${selectedIds.join(",")}`}
                style={{ "--candy-edge": "#3a9c4c" } as React.CSSProperties}
                className="btn-candy rounded-full bg-crayon-green px-5 py-2 text-sm font-extrabold text-white"
              >
                🖨️ Stampa {selectedIds.length}{" "}
                {selectedIds.length === 1 ? "disegno" : "disegni"}
              </Link>
            )}
          </>
        )}
      </div>

      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {drawings.map((d, i) => {
          const isSelected = selected.has(d.id);
          const look = {
            "--tilt": `${TILTS[i % TILTS.length]}deg`,
            "--tape": TAPES[i % TAPES.length],
          } as React.CSSProperties;
          return (
            <li
              key={d.id}
              className="pop-in relative"
              style={{ "--i": Math.min(i, 12) } as React.CSSProperties}
            >
              {selecting ? (
                <button
                  type="button"
                  onClick={() => toggle(d.id)}
                  aria-pressed={isSelected}
                  style={look}
                  className={`polaroid card-sticker block w-full rounded-3xl bg-white p-3 text-left active:scale-95 ${
                    isSelected ? "ring-4 ring-crayon-green" : ""
                  }`}
                >
                  <DrawingThumb
                    content={d.content}
                    fills={d.fills}
                    strokes={d.strokes}
                  />
                  <p className="mt-2 line-clamp-2 text-sm font-bold">
                    {d.prompt}
                  </p>
                  <span
                    className={`absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-sm font-extrabold shadow ${
                      isSelected
                        ? "bg-crayon-green text-white"
                        : "bg-white text-stone-300"
                    }`}
                  >
                    {isSelected ? "✓" : ""}
                  </span>
                </button>
              ) : (
                <>
                  <Link
                    href={`/color/${d.id}${hrefSuffix}`}
                    style={look}
                    className="polaroid polaroid-tape card-sticker relative block rounded-3xl bg-white p-3 hover:shadow-2xl active:scale-95"
                  >
                    <DrawingThumb
                      content={d.content}
                      fills={d.fills}
                      strokes={d.strokes}
                    />
                    <p className="mt-2 line-clamp-2 text-sm font-bold">
                      {d.prompt}
                    </p>
                    <p className="mt-0.5 text-xs text-stone-400">
                      {d.badge ? `${d.badge} · ` : ""}
                      {new Date(d.createdAt).toLocaleDateString("it-IT")}
                    </p>
                  </Link>
                  <Link
                    href={`/print/${d.id}`}
                    aria-label={`Stampa il disegno ${d.prompt}`}
                    className="absolute left-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-sm shadow-md backdrop-blur transition hover:bg-crayon-yellow/40 active:scale-90"
                  >
                    🖨️
                  </Link>
                  <button
                    type="button"
                    aria-label={`Elimina il disegno ${d.prompt}`}
                    onClick={() => setConfirming(d.id)}
                    className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-sm shadow-md backdrop-blur transition hover:bg-red-50 active:scale-90"
                  >
                    🗑️
                  </button>
                </>
              )}

              {confirming === d.id && (
                <div className="pop-in absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-3xl bg-white/95 p-3 text-center backdrop-blur">
                  <p className="text-sm font-bold text-stone-600">
                    Butto via questo disegno?
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleDelete(d.id)}
                      className="rounded-full bg-red-500 px-4 py-2 text-sm font-extrabold text-white shadow transition active:scale-95"
                    >
                      Sì, butta
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirming(null)}
                      className="rounded-full bg-stone-100 px-4 py-2 text-sm font-bold text-stone-600 transition active:scale-95"
                    >
                      No
                    </button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
