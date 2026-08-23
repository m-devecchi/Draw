import type { SupabaseClient } from "@supabase/supabase-js";
import { isReusable, normalizePrompt } from "./prompt-key";

// Quanti disegni diversi si tengono per lo stesso soggetto: chiedendo due
// volte "un dinosauro" è meglio non ricevere il foglio identico, ma non ha
// senso pagarne uno nuovo all'infinito.
const MAX_VARIANTI = 3;

export interface CachedTemplate {
  id: string;
  content: string;
  kind: "svg" | "raster";
}

export interface CacheLookup {
  /** Disegno già pronto da riusare, se c'è. */
  template: CachedTemplate | null;
  /** Chiave normalizzata; null se la richiesta non è riusabile. */
  key: string | null;
}

/**
 * Cerca un disegno già generato per questa richiesta.
 *
 * Se l'utente ha già ricevuto tutte le varianti esistenti e siamo sotto
 * il tetto, restituisce null: gliene verrà disegnata una nuova, così non
 * si ritrova due volte lo stesso foglio.
 *
 * Tollera l'assenza della tabella (migrazione 0006 non ancora applicata):
 * in quel caso si genera normalmente, senza rompere nulla.
 */
export async function findReusable(
  admin: SupabaseClient,
  userId: string,
  prompt: string,
  ageBand: string
): Promise<CacheLookup> {
  const key = normalizePrompt(prompt);
  if (!isReusable(key)) return { template: null, key: null };

  try {
    const { data: templates, error } = await admin
      .from("drawing_templates")
      .select("id, content, kind")
      .eq("prompt_key", key)
      .eq("age_band", ageBand);
    if (error || !templates?.length) return { template: null, key };

    // Quali di questi l'utente ha già?
    const { data: propri } = await admin
      .from("drawings")
      .select("template_id")
      .eq("user_id", userId)
      .in(
        "template_id",
        templates.map((t) => t.id)
      );
    const gia = new Set((propri ?? []).map((d) => d.template_id));

    const nuovi = templates.filter((t) => !gia.has(t.id));
    if (nuovi.length) {
      return {
        template: nuovi[Math.floor(Math.random() * nuovi.length)] as CachedTemplate,
        key,
      };
    }

    // Li ha già tutti: se c'è spazio se ne disegna uno nuovo, altrimenti
    // si riusa comunque uno dei suoi.
    if (templates.length < MAX_VARIANTI) return { template: null, key };
    return {
      template: templates[
        Math.floor(Math.random() * templates.length)
      ] as CachedTemplate,
      key,
    };
  } catch {
    return { template: null, key };
  }
}

/** Registra un disegno appena generato perché possa essere riusato. */
export async function saveTemplate(
  admin: SupabaseClient,
  params: {
    key: string | null;
    prompt: string;
    ageBand: string;
    provider: string;
    kind: string;
    content: string;
  }
): Promise<string | null> {
  if (!params.key) return null;
  try {
    const { data } = await admin
      .from("drawing_templates")
      .insert({
        prompt_key: params.key,
        prompt: params.prompt,
        age_band: params.ageBand,
        provider: params.provider,
        kind: params.kind,
        content: params.content,
      })
      .select("id")
      .single();
    return data?.id ?? null;
  } catch {
    return null; // migrazione non applicata: si prosegue senza riuso
  }
}

/** Segna un riuso (serve solo a misurare quanto la cache sta lavorando). */
export async function bumpUses(admin: SupabaseClient, templateId: string) {
  try {
    await admin.rpc("bump_template_uses", { template: templateId });
  } catch {
    // contatore non essenziale
  }
}
