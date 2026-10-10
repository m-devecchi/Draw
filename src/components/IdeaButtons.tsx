"use client";

import { Emoji } from "@/components/ui/Emoji";

// Idee pronte come grandi pulsanti illustrati: un bambino che non sa
// ancora leggere riconosce il disegno dall'immagine e tocca quello.
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

// Un fondo pastello per ogni tessera, a rotazione.
const TINTS = [
  "bg-sky-50",
  "bg-sun-50",
  "bg-mint-50",
  "bg-bubble-50",
  "bg-grape-50",
  "bg-tomato-50",
];

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
    <ul className="grid grid-cols-4 gap-2.5 sm:grid-cols-6">
      {IDEAS.map((idea, i) => {
        const active = selected === idea.prompt;
        return (
          <li
            key={idea.label}
            className="rise-in"
            style={{ "--i": i } as React.CSSProperties}
          >
            <button
              type="button"
              disabled={disabled}
              onClick={() => onPick(idea.prompt)}
              aria-pressed={active}
              className={`ink-tile flex w-full flex-col items-center gap-0.5 px-1 pb-1.5 pt-2 disabled:opacity-40 ${TINTS[i % TINTS.length]}`}
            >
              <Emoji char={idea.emoji} size={46} />
              <span className="text-[0.72rem] font-extrabold leading-tight">
                {idea.label}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
