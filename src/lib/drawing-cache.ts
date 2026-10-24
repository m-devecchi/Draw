import {
  bumpTemplateUses,
  findTemplates,
  insertTemplate,
  ownedTemplateIds,
  type TemplateRow,
} from "./db/repo";
import { isReusable, normalizePrompt } from "./prompt-key";

// Quanti disegni diversi si tengono per lo stesso soggetto: chiedendo due
// volte "un dinosauro" è meglio non ricevere il foglio identico, ma non ha
// senso pagarne uno nuovo all'infinito.
const MAX_VARIANTI = 3;

export type CachedTemplate = TemplateRow;

export interface CacheLookup {
  /** Disegno già pronto da riusare, se c'è. */
  template: CachedTemplate | null;
  /** Chiave normalizzata; null se la richiesta non è riusabile. */
  key: string | null;
}

/** Accesso ai dati della cache: iniettabile, così i test non toccano il DB. */
export interface CacheStore {
  findTemplates(key: string, ageBand: string): Promise<CachedTemplate[]>;
  ownedTemplateIds(userId: string, ids: string[]): Promise<string[]>;
}

const dbStore: CacheStore = { findTemplates, ownedTemplateIds };

/**
 * Cerca un disegno già generato per questa richiesta.
 *
 * Se l'utente ha già ricevuto tutte le varianti esistenti e siamo sotto
 * il tetto, restituisce null: gliene verrà disegnata una nuova, così non
 * si ritrova due volte lo stesso foglio.
 *
 * Se la cache non risponde (database in errore) si genera normalmente,
 * senza rompere nulla.
 */
export async function findReusable(
  userId: string,
  prompt: string,
  ageBand: string,
  store: CacheStore = dbStore
): Promise<CacheLookup> {
  const key = normalizePrompt(prompt);
  if (!isReusable(key)) return { template: null, key: null };

  try {
    const templates = await store.findTemplates(key, ageBand);
    if (!templates.length) return { template: null, key };

    // Quali di questi l'utente ha già?
    const gia = new Set(
      await store.ownedTemplateIds(
        userId,
        templates.map((t) => t.id)
      )
    );

    const nuovi = templates.filter((t) => !gia.has(t.id));
    if (nuovi.length) {
      return {
        template: nuovi[Math.floor(Math.random() * nuovi.length)],
        key,
      };
    }

    // Li ha già tutti: se c'è spazio se ne disegna uno nuovo, altrimenti
    // si riusa comunque uno dei suoi.
    if (templates.length < MAX_VARIANTI) return { template: null, key };
    return {
      template: templates[Math.floor(Math.random() * templates.length)],
      key,
    };
  } catch {
    return { template: null, key };
  }
}

/** Registra un disegno appena generato perché possa essere riusato. */
export async function saveTemplate(params: {
  key: string | null;
  prompt: string;
  ageBand: string;
  provider: string;
  kind: string;
  content: string;
}): Promise<string | null> {
  if (!params.key) return null;
  try {
    return await insertTemplate({ ...params, key: params.key });
  } catch {
    return null; // si prosegue senza riuso
  }
}

/** Segna un riuso (serve solo a misurare quanto la cache sta lavorando). */
export async function bumpUses(templateId: string) {
  try {
    await bumpTemplateUses(templateId);
  } catch {
    // contatore non essenziale
  }
}
