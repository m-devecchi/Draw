"use client";

import { ERASER, PALETTE } from "./palette";

export function ColorPalette({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (color: string) => void;
}) {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {PALETTE.map((color) => (
        <button
          key={color}
          type="button"
          aria-label={`Colore ${color}`}
          onClick={() => onSelect(color)}
          style={{ backgroundColor: color }}
          className={`h-11 w-11 rounded-full border-4 shadow transition active:scale-90 ${
            selected === color
              ? "scale-110 border-stone-700"
              : "border-white"
          }`}
        />
      ))}
      <button
        type="button"
        aria-label="Gomma"
        onClick={() => onSelect(ERASER)}
        className={`flex h-11 w-11 items-center justify-center rounded-full border-4 bg-white text-xl shadow transition active:scale-90 ${
          selected === ERASER ? "scale-110 border-stone-700" : "border-stone-200"
        }`}
      >
        🧽
      </button>
    </div>
  );
}
