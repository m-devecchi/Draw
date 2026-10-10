"use client";

import { AGE_BANDS, AGE_SETUP, type AgeBand } from "@/lib/age-bands";
import { Emoji } from "@/components/ui/Emoji";

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
    <fieldset>
      <legend className="mb-2 text-sm font-extrabold text-ink">
        Chi colora questo disegno?
      </legend>
      <div className="grid grid-cols-3 gap-2.5">
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
              className="ink-tile flex items-center justify-center gap-2 bg-paper px-2 py-2 disabled:opacity-40 max-sm:flex-col max-sm:gap-0.5"
            >
              <Emoji char={setup.icon} size={34} decorative />
              <span className="font-display text-[0.95rem] font-bold leading-tight">
                {setup.label}
              </span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
