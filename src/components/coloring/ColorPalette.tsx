"use client";

import { ERASER, PALETTE } from "./palette";

// Palette flottante da app per bambini: matitoni tondi grandi, scorrimento
// orizzontale sul telefono, il colore scelto "salta" fuori dalla barra.
export function ColorPalette({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (color: string) => void;
}) {
  return (
    <div className="pointer-events-auto mx-auto w-fit max-w-full">
      <div className="flex items-center gap-2.5 overflow-x-auto rounded-full bg-white/85 px-4 py-3 shadow-2xl ring-1 ring-black/5 backdrop-blur-md [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {PALETTE.map((color) => (
          <button
            key={color}
            type="button"
            aria-label={`Colore ${color}`}
            aria-pressed={selected === color}
            onClick={() => onSelect(color)}
            style={{ backgroundColor: color }}
            className={`h-12 w-12 shrink-0 rounded-full border-4 shadow-md transition-transform active:scale-90 ${
              selected === color
                ? "swatch-picked -translate-y-2 scale-125 border-white ring-4 ring-stone-700/70"
                : "border-white/70"
            }`}
          />
        ))}
        <button
          type="button"
          aria-label="Gomma"
          aria-pressed={selected === ERASER}
          onClick={() => onSelect(ERASER)}
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-4 bg-white text-2xl shadow-md transition-transform active:scale-90 ${
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
