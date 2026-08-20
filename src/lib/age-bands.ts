import { EFFECTS, type Effect } from "./paint";
import { PALETTE } from "@/components/coloring/palette";

// Versioni per età: gli stessi disegni, ma strumenti proporzionati.
// Un bimbo di 2 anni si perde con nove effetti; uno di 8 li vuole tutti.
export const AGE_BANDS = ["small", "medium", "big"] as const;
export type AgeBand = (typeof AGE_BANDS)[number];


export interface AgeSetup {
  label: string;
  hint: string;
  icon: string;
  /** Colori offerti nella palette. */
  colors: readonly string[];
  /** Effetti di riempimento disponibili. */
  effects: readonly Effect[];
  /** Disegno a mano libera. */
  freehand: boolean;
  /** Pastelli più grandi per le dita piccole. */
  swatchSize: string;
}

// Otto colori ben distinti per i più piccoli: niente sfumature di grigio
// o tonalità simili tra loro, che confondono.
const BIG_COLORS = [
  "#ff5c5c",
  "#ff9f43",
  "#ffce3e",
  "#58cc6d",
  "#4ea7ff",
  "#a06bff",
  "#ff8ad4",
  "#b5651d",
] as const;

export const AGE_SETUP: Record<AgeBand, AgeSetup> = {
  small: {
    label: "2-3 anni",
    hint: "Pochi colori grandi, nessun effetto: solo toccare e colorare.",
    icon: "🍼",
    colors: BIG_COLORS,
    effects: ["flat"],
    freehand: false,
    swatchSize: "h-16 w-16",
  },
  medium: {
    label: "4-6 anni",
    hint: "Palette completa, sei effetti e mano libera.",
    icon: "🧒",
    colors: PALETTE,
    effects: ["flat", "gradient", "dots", "stripes", "hearts", "stars"],
    freehand: true,
    swatchSize: "h-12 w-12",
  },
  big: {
    label: "7 anni e più",
    hint: "Tutti gli effetti e tutti gli strumenti.",
    icon: "🧑",
    colors: PALETTE,
    effects: EFFECTS,
    freehand: true,
    swatchSize: "h-12 w-12",
  },
};

/**
 * Configurazione per una fascia d'età.
 * Senza fascia indicata (nessun profilo bambino, modalità demo) si offre
 * l'esperienza completa: non ha senso nascondere strumenti a un adulto
 * o a chi non usa i profili.
 */
export function ageSetup(band: string | null | undefined): AgeSetup {
  return AGE_SETUP[(band as AgeBand) in AGE_SETUP ? (band as AgeBand) : "big"];
}

/** Legge la fascia scelta dal genitore (cookie), o null se non ha ancora scelto. */
export function parseAgeBand(value: string | undefined | null): AgeBand | null {
  return AGE_BANDS.includes(value as AgeBand) ? (value as AgeBand) : null;
}
