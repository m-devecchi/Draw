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
      {IDEAS.map((idea) => {
        const active = selected === idea.prompt;
        return (
          <li key={idea.label}>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onPick(idea.prompt)}
              aria-pressed={active}
              className={`flex w-full flex-col items-center gap-0.5 rounded-2xl px-1 py-2 transition active:scale-90 disabled:opacity-40 ${
                active
                  ? "bg-crayon-yellow shadow-md ring-2 ring-stone-600/40"
                  : "bg-stone-50 hover:bg-crayon-yellow/30"
              }`}
            >
              <span className="text-3xl">{idea.emoji}</span>
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
