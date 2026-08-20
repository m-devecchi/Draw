import { setAgeBandAction } from "@/app/actions/age";
import { AGE_BANDS, AGE_SETUP, type AgeBand } from "@/lib/age-bands";

/**
 * Scelta dell'età di chi disegna.
 *
 * `variant="onboarding"` è la domanda iniziale, in evidenza sulla home
 * finché il genitore non ha scelto; `variant="settings"` è la stessa
 * scelta nell'area genitori, per cambiarla dopo.
 *
 * Usa un <form> con server action: funziona anche prima che il
 * JavaScript sia pronto, e il cookie lo scrive il server.
 */
export function AgeChooser({
  current,
  variant = "settings",
}: {
  current: AgeBand | null;
  variant?: "onboarding" | "settings";
}) {
  const onboarding = variant === "onboarding";

  return (
    <div
      className={
        onboarding
          ? "rounded-3xl bg-crayon-yellow/30 p-6 shadow-xl ring-2 ring-crayon-yellow"
          : ""
      }
    >
      <h2
        className={
          onboarding
            ? "mb-1 text-2xl font-extrabold"
            : "mb-1 text-xl font-extrabold"
        }
      >
        {onboarding ? "👋 Quanti anni ha chi disegna?" : "Età di chi disegna"}
      </h2>
      <p className="mb-4 text-sm text-stone-500">
        {onboarding
          ? "Così prepariamo gli strumenti giusti. Potrai cambiarla quando vuoi dall'area genitori."
          : "Decide colori, effetti e strumenti disponibili durante la coloritura."}
      </p>

      <div className="grid gap-2 sm:grid-cols-3">
        {AGE_BANDS.map((band) => {
          const setup = AGE_SETUP[band];
          const active = current === band;
          return (
            <form action={setAgeBandAction} key={band}>
              <input type="hidden" name="band" value={band} />
              <button
                type="submit"
                aria-pressed={active}
                className={`flex w-full flex-col items-center gap-1 rounded-2xl p-4 text-center transition active:scale-95 ${
                  active
                    ? "bg-crayon-yellow shadow-md ring-2 ring-stone-600/40"
                    : "bg-white shadow hover:bg-crayon-yellow/20"
                }`}
              >
                <span className="text-4xl">{setup.icon}</span>
                <span className="font-extrabold">{setup.label}</span>
                <span className="text-xs font-semibold leading-tight text-stone-500">
                  {setup.hint}
                </span>
              </button>
            </form>
          );
        })}
      </div>
    </div>
  );
}
