"use client";

// Idee pronte come grandi pulsanti illustrati: un bambino che non sa
// ancora leggere riconosce il disegno dall'immagine e tocca quello.
// Sostituiscono le vecchie "pilloline" grigie di testo.
export const IDEAS = [
  { emoji: "🦕", label: "dinosauro", prompt: "Un dinosauro felice" },
  { emoji: "🐱", label: "gattino", prompt: "Un gattino con un palloncino" },
  { emoji: "🚀", label: "razzo", prompt: "Un razzo tra le stelle" },
  { emoji: "🐠", label: "pesciolino", prompt: "Un pesciolino nel mare" },
  { emoji: "🦄", label: "unicorno", prompt: "Un unicorno con l'arcobaleno" },
  { emoji: "🚂", label: "trenino", prompt: "Un trenino in montagna" },
  { emoji: "🏰", label: "castello", prompt: "Un castello con la principessa" },
  { emoji: "🐘", label: "elefante", prompt: "Un elefantino che fa il bagno" },
  { emoji: "🚜", label: "trattore", prompt: "Un trattore in fattoria" },
  { emoji: "🦋", label: "farfalla", prompt: "Una farfalla nel prato" },
  { emoji: "⛵", label: "barca", prompt: "Una barca a vela sul mare" },
  { emoji: "🐻", label: "orsetto", prompt: "Un orsetto con il miele" },
] as const;

// Un pastello di sfondo per ogni idea, a rotazione.
const TINTS = ["#fff1c2", "#ffe0e0", "#dcefff", "#dcf6e1", "#efe4ff", "#ffe6f5"];

export function IdeaButtons({
  selected,
  onPick,
  disabled,
}: {
  selected: string;
  onPick: (prompt: string) => void;
  disabled?: boolean;
}) {
  return (
    <ul className="grid grid-cols-4 gap-2 sm:grid-cols-6">
      {IDEAS.map((idea, i) => {
        const active = selected === idea.prompt;
        return (
          <li
            key={idea.label}
            className="pop-in"
            style={{ "--i": i } as React.CSSProperties}
          >
            <button
              type="button"
              disabled={disabled}
              onClick={() => onPick(idea.prompt)}
              aria-pressed={active}
              style={active ? undefined : { backgroundColor: TINTS[i % TINTS.length] }}
              className={`wiggle-on-hover flex w-full flex-col items-center gap-0.5 rounded-2xl px-1 py-2 transition hover:-translate-y-0.5 active:scale-90 disabled:opacity-40 ${
                active
                  ? "bg-crayon-yellow shadow-[0_4px_0_#e0a800] ring-2 ring-white"
                  : "shadow-[0_3px_0_rgba(58,46,42,0.08)]"
              }`}
            >
              <span className="wiggle-target text-3xl drop-shadow-sm">
                {idea.emoji}
              </span>
              <span className="text-[11px] font-bold text-stone-500">
                {idea.label}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
