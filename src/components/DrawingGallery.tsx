"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { DrawingThumb } from "./DrawingThumb";
import { Emoji } from "@/components/ui/Emoji";
import { Icon } from "@/components/ui/Icon";
import { demoStore } from "@/lib/demo-store";
import type { Stroke } from "@/lib/strokes";

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

  const smallBtn =
    "flex h-9 w-9 items-center justify-center rounded-full border-2 border-ink bg-paper shadow-[2px_2px_0_#1d1638] transition hover:-translate-y-px active:translate-x-px active:translate-y-px active:shadow-none";

  return (
    <div>
      {/* Barra della selezione */}
      <div className="mb-4 flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          onClick={() => {
            setSelecting((s) => !s);
            setSelected(new Set());
          }}
          aria-pressed={selecting}
          className={`ink-btn px-4 py-2.5 text-[0.95rem] ${selecting ? "ink-btn-sun" : ""}`}
        >
          <Icon name={selecting ? "x" : "print"} className="!h-5 !w-5" />
          {selecting ? "Annulla selezione" : "Stampa più disegni"}
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
              className="ink-btn px-4 py-2.5 text-[0.95rem]"
            >
              {selected.size === drawings.length ? "Nessuno" : "Tutti"}
            </button>
            {selectedIds.length > 0 && (
              <Link
                href={`/print/insieme?ids=${selectedIds.join(",")}`}
                className="ink-btn ink-btn-mint px-5 py-2.5 text-[0.95rem]"
              >
                <Icon name="print" className="!h-5 !w-5" />
                Stampa {selectedIds.length}{" "}
                {selectedIds.length === 1 ? "disegno" : "disegni"}
              </Link>
            )}
          </>
        )}
      </div>

      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 sm:gap-5">
        {drawings.map((d, i) => {
          const isSelected = selected.has(d.id);
          const caption = (
            <div className="mt-2 px-1">
              <p className="line-clamp-2 font-display text-[1.02rem] font-bold leading-tight">
                {d.prompt}
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-xs font-bold text-ink-soft">
                {d.badge && <Emoji char={d.badge} size={18} decorative />}
                {new Date(d.createdAt).toLocaleDateString("it-IT", {
                  day: "numeric",
                  month: "short",
                })}
              </p>
            </div>
          );
          return (
            <li
              key={d.id}
              className="rise-in relative"
              style={{ "--i": Math.min(i, 12) } as React.CSSProperties}
            >
              {selecting ? (
                <button
                  type="button"
                  onClick={() => toggle(d.id)}
                  aria-pressed={isSelected}
                  className={`ink-card drawing-card block w-full p-2.5 text-left ${
                    isSelected ? "!bg-mint-50" : ""
                  }`}
                >
                  <div className="overflow-hidden rounded-2xl border-2 border-ink/15">
                    <DrawingThumb
                      content={d.content}
                      fills={d.fills}
                      strokes={d.strokes}
                    />
                  </div>
                  {caption}
                  <span
                    className={`absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border-2 border-ink ${
                      isSelected ? "bg-mint text-white" : "bg-paper text-transparent"
                    }`}
                  >
                    <Icon name="check" className="!h-5 !w-5" />
                  </span>
                </button>
              ) : (
                <>
                  <Link
                    href={`/color/${d.id}${hrefSuffix}`}
                    className="ink-card drawing-card block p-2.5"
                  >
                    <div className="overflow-hidden rounded-2xl border-2 border-ink/15">
                      <DrawingThumb
                        content={d.content}
                        fills={d.fills}
                        strokes={d.strokes}
                      />
                    </div>
                    {caption}
                  </Link>
                  <Link
                    href={`/print/${d.id}`}
                    aria-label={`Stampa il disegno ${d.prompt}`}
                    className={`${smallBtn} absolute left-4 top-4`}
                  >
                    <Icon name="print" className="!h-[1.1rem] !w-[1.1rem]" />
                  </Link>
                  <button
                    type="button"
                    aria-label={`Elimina il disegno ${d.prompt}`}
                    onClick={() => setConfirming(d.id)}
                    className={`${smallBtn} absolute right-4 top-4 hover:bg-tomato-50`}
                  >
                    <Icon name="trash" className="!h-[1.1rem] !w-[1.1rem]" />
                  </button>
                </>
              )}

              {confirming === d.id && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-3xl border-[2.5px] border-ink bg-paper/95 p-3 text-center backdrop-blur-sm">
                  <p className="font-display text-lg font-bold leading-tight">
                    Butto via questo disegno?
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleDelete(d.id)}
                      className="ink-btn ink-btn-primary px-4 py-2 text-sm"
                    >
                      Sì, butta
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirming(null)}
                      className="ink-btn px-4 py-2 text-sm"
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
