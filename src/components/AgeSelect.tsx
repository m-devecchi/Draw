"use client";

import { AGE_BANDS, AGE_SETUP, type AgeBand } from "@/lib/age-bands";

// Scelta dell'età, dentro il modulo di creazione: si indica a ogni
// disegno, come il prompt. Su un telefono di famiglia il fratello che
// disegna cambia spesso, quindi non è un'impostazione da fare una volta.
export function AgeSelect({
  value,
  onChange,
  disabled,
}: {
  value: AgeBand;
  onChange: (band: AgeBand) => void;
  disabled?: boolean;
}) {
  return (
    <div>
      <p className="mb-2 text-sm font-bold text-stone-400">
        Chi colora questo disegno? 👶
      </p>
      <div className="grid grid-cols-3 gap-2">
        {AGE_BANDS.map((band) => {
          const setup = AGE_SETUP[band];
          const active = value === band;
          return (
            <button
              key={band}
              type="button"
              disabled={disabled}
              onClick={() => onChange(band)}
              aria-pressed={active}
              className={`flex flex-col items-center gap-0.5 rounded-2xl px-2 py-2 transition active:scale-95 disabled:opacity-40 ${
                active
                  ? "bg-crayon-yellow shadow-md ring-2 ring-stone-600/40"
                  : "bg-stone-50 hover:bg-crayon-yellow/30"
              }`}
            >
              <span className="text-2xl">{setup.icon}</span>
              <span className="text-xs font-extrabold text-stone-600">
                {setup.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
