"use client";

import { useState } from "react";
import { EFFECT_LABELS, type Effect } from "@/lib/paint";
import { ERASER, PALETTE } from "./palette";

// Palette flottante da app per bambini: matitoni tondi grandi, scorrimento
// orizzontale sul telefono, il colore scelto "salta" fuori dalla barra.
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
  const showEffects = effects.length > 1;

  const swatch = (active: boolean) =>
    `swatch-gloss ${swatchSize} shrink-0 rounded-full border-4 shadow-[0_3px_0_rgba(58,46,42,0.18)] transition-transform hover:-translate-y-1 active:scale-90 ${
      active
        ? "swatch-picked -translate-y-2 scale-125 border-white ring-4 ring-stone-700/70"
        : "border-white/70"
    }`;

  return (
    <div className="pointer-events-auto mx-auto w-fit max-w-full px-2">
      {/* Cassetto degli effetti, sopra la palette */}
      {trayOpen && showEffects && (
        <div className="mx-auto mb-2 grid w-fit max-w-full grid-cols-5 gap-1.5 rounded-3xl bg-white/90 p-2 shadow-2xl ring-1 ring-black/5 backdrop-blur-md">
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
              className={`flex h-14 w-14 flex-col items-center justify-center rounded-2xl transition active:scale-90 ${
                effect === e
                  ? "bg-crayon-yellow shadow ring-2 ring-stone-600/40"
                  : "bg-stone-50"
              }`}
            >
              <span className="text-2xl">{EFFECT_LABELS[e].icon}</span>
              <span className="text-[9px] font-bold leading-tight text-stone-500">
                {EFFECT_LABELS[e].name}
              </span>
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2.5 overflow-x-auto rounded-full bg-white/85 px-4 pb-3 pt-6 shadow-2xl ring-1 ring-black/5 backdrop-blur-md [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {showEffects && (
          <>
            <button
              type="button"
              onClick={() => setTrayOpen((o) => !o)}
              aria-label={`Effetto: ${EFFECT_LABELS[effect].name}. Tocca per cambiarlo`}
              aria-expanded={trayOpen}
              title={EFFECT_LABELS[effect].name}
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-4 bg-white text-2xl shadow-md transition-transform active:scale-90 ${
                trayOpen ? "border-crayon-yellow" : "border-stone-200"
              }`}
            >
              {EFFECT_LABELS[effect].icon}
            </button>
            <span className="h-8 w-px shrink-0 bg-stone-200" />
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
            className={swatch(selected === color)}
          />
        ))}

        <button
          type="button"
          aria-label="Gomma"
          aria-pressed={selected === ERASER}
          onClick={() => onSelect(ERASER)}
          className={`flex ${swatchSize} shrink-0 items-center justify-center rounded-full border-4 bg-white text-2xl shadow-md transition-transform active:scale-90 ${
            selected === ERASER
              ? "swatch-picked -translate-y-2 scale-125 border-white ring-4 ring-stone-700/70"
              : "border-stone-200"
          }`}
        >
          🧽
        </button>
      </div>
    </div>
  );
}
