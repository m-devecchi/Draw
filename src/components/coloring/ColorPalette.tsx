"use client";

import { useEffect, useState } from "react";
import { EFFECT_LABELS, paintValue, type Effect } from "@/lib/paint";
import { Icon } from "@/components/ui/Icon";
import { ERASER, PALETTE } from "./palette";

const previewCache = new Map<string, string>();

/**
 * Anteprima dell'effetto nel colore scelto, come immagine CSS: si genera
 * con lo stesso codice che riempie il disegno, quindi è identica a ciò
 * che apparirà toccando un'area.
 */
function effectPreview(color: string, effect: Effect): string {
  // Lato server non c'è DOM: l'anteprima arriva all'idratazione.
  if (typeof document === "undefined") return "none";
  const key = `${color}:${effect}`;
  const cached = previewCache.get(key);
  if (cached) return cached;
  const NS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(NS, "svg") as SVGSVGElement;
  svg.setAttribute("xmlns", NS);
  svg.setAttribute("width", "52");
  svg.setAttribute("height", "52");
  svg.setAttribute("viewBox", "0 0 52 52");
  const rect = document.createElementNS(NS, "rect");
  rect.setAttribute("width", "52");
  rect.setAttribute("height", "52");
  rect.setAttribute("fill", paintValue(svg, color, effect));
  svg.appendChild(rect);
  const url = `url("data:image/svg+xml,${encodeURIComponent(
    new XMLSerializer().serializeToString(svg)
  )}")`;
  previewCache.set(key, url);
  return url;
}

// Palette a dock: pastelli tondi a contorno d'inchiostro; il colore
// scelto si solleva dalla barra.
export function ColorPalette({
  selected,
  onSelect,
  effect,
  onEffectChange,
  effects,
  colors = PALETTE as readonly string[],
  swatchSize = "h-12 w-12",
}: {
  selected: string;
  onSelect: (color: string) => void;
  /** Effetto del "secchiello": tinta piatta, sfumatura, pois, ... */
  effect: Effect;
  onEffectChange: (effect: Effect) => void;
  /** Effetti offerti (variano con l'età del bambino). */
  effects: readonly Effect[];
  /** Colori offerti (i più piccoli ne hanno pochi e grandi). */
  colors?: readonly string[];
  swatchSize?: string;
}) {
  const [trayOpen, setTrayOpen] = useState(false);
  // Le anteprime si generano col DOM: solo dopo il montaggio, così
  // server e client producono lo stesso HTML iniziale.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const preview = (color: string, e: Effect) =>
    mounted ? effectPreview(color, e) : "none";
  const showEffects = effects.length > 1;
  // Le anteprime usano il colore in mano (con la gomma, il primo colore)
  const previewColor = selected === ERASER ? colors[0] : selected;

  return (
    <div className="pointer-events-auto mx-auto w-fit max-w-full px-3">
      {/* Cassetto degli effetti, sopra la palette */}
      {trayOpen && showEffects && (
        <div className="ink-card mx-auto mb-3 w-fit max-w-full p-3">
          <p className="mb-2 px-1 font-display text-base font-bold">
            Come vuoi colorare?
          </p>
          <div className="grid grid-cols-5 gap-2">
            {effects.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => {
                  onEffectChange(e);
                  setTrayOpen(false);
                }}
                aria-label={EFFECT_LABELS[e].name}
                aria-pressed={effect === e}
                className="group flex w-14 flex-col items-center gap-1"
              >
                <span
                  className={`block h-12 w-12 rounded-2xl border-[2.5px] border-ink transition group-active:scale-90 ${
                    effect === e
                      ? "shadow-[0_0_0_3px_#fff,0_0_0_5.5px_#1d1638]"
                      : "shadow-[2px_2px_0_#1d1638]"
                  }`}
                  style={{ backgroundImage: preview(previewColor, e) }}
                />
                <span className="text-[0.62rem] font-extrabold leading-tight">
                  {EFFECT_LABELS[e].name}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 overflow-x-auto rounded-full border-[2.5px] border-ink bg-paper px-4 pb-3 pt-5 shadow-[5px_5px_0_#1d1638] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {showEffects && (
          <>
            <button
              type="button"
              onClick={() => setTrayOpen((o) => !o)}
              aria-label={`Effetto: ${EFFECT_LABELS[effect].name}. Tocca per cambiarlo`}
              aria-expanded={trayOpen}
              title={EFFECT_LABELS[effect].name}
              className="relative h-12 w-12 shrink-0 rounded-2xl border-[2.5px] border-ink shadow-[0_3px_0_#1d1638] transition active:scale-90"
              style={{ backgroundImage: preview(previewColor, effect) }}
            >
              <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border-2 border-ink bg-sun">
                <Icon name="sparkles" className="!h-3.5 !w-3.5" />
              </span>
            </button>
            <span className="h-9 w-[2.5px] shrink-0 rounded-full bg-ink/15" />
          </>
        )}

        {colors.map((color) => (
          <button
            key={color}
            type="button"
            aria-label={`Colore ${color}`}
            aria-pressed={selected === color}
            onClick={() => onSelect(color)}
            style={{ backgroundColor: color }}
            className={`swatch ${swatchSize} shrink-0 rounded-full border-[2.5px] border-ink`}
          />
        ))}

        <button
          type="button"
          aria-label="Gomma"
          aria-pressed={selected === ERASER}
          onClick={() => onSelect(ERASER)}
          className={`swatch flex ${swatchSize} shrink-0 items-center justify-center rounded-full border-[2.5px] border-ink bg-paper`}
        >
          <Icon name="eraser" />
        </button>
      </div>
    </div>
  );
}
