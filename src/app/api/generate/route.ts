import { NextResponse } from "next/server";
import { z } from "zod";
import { isDemoMode } from "@/lib/config";
import { getGenerationProvider } from "@/lib/generation";
import {
  bumpUses,
  findReusable,
  saveTemplate,
} from "@/lib/drawing-cache";
import { getQuotaStatus, parseLimit } from "@/lib/quota";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 300; // la generazione può richiedere qualche minuto

const bodySchema = z.object({
  prompt: z.string().trim().min(2).max(300),
  // Bambino a cui associare il disegno (validato lato server: deve
  // appartenere all'utente autenticato).
  kidId: z.string().uuid().nullish(),
  // Età di chi colorerà: scelta a ogni creazione e salvata col disegno.
  ageBand: z.enum(["small", "medium", "big"]).default("big"),
});

// ── Limite giornaliero della modalità PoC ───────────────────────────────
// Best-effort, in memoria e per IP: sufficiente per un PoC, sostituito
// dalla quota per utente su Postgres nella modalità completa.
const demoUsage = new Map<string, { day: string; count: number }>();

function demoQuotaExceeded(request: Request): boolean {
  const limit = parseLimit(process.env.DEMO_DAILY_LIMIT, 10);
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const day = new Date().toISOString().slice(0, 10);
  const entry = demoUsage.get(ip);
  if (!entry || entry.day !== day) {
    demoUsage.set(ip, { day, count: 1 });
    return false;
  }
  if (entry.count >= limit) return true;
  entry.count += 1;
  return false;
}

async function handleDemo(
  request: Request,
  prompt: string,
  ageBand: "small" | "medium" | "big"
) {
  if (demoQuotaExceeded(request)) {
    return NextResponse.json(
      {
        error: "Limite giornaliero della demo raggiunto, riprova domani.",
        code: "quota_exceeded",
      },
      { status: 429 }
    );
  }
  try {
    const result = await getGenerationProvider().generate(prompt, {
      ageBand,
    });
    // Nessun database: il client salva il disegno in localStorage.
    return NextResponse.json({
      demo: true,
      kind: result.kind,
      content: result.content,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Generazione non riuscita";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

export async function POST(request: Request) {
  const rawBody = await request.json().catch(() => null);
  const demoParsed = bodySchema.safeParse(rawBody);
  if (!demoParsed.success) {
    return NextResponse.json(
      { error: "Prompt non valido (2-300 caratteri)" },
      { status: 400 }
    );
  }

  if (isDemoMode()) {
    return handleDemo(request, demoParsed.data.prompt, demoParsed.data.ageBand);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  }

  const { prompt } = demoParsed.data;

  // Controllo quota lato server: 2/giorno per il piano free.
  const quota = await getQuotaStatus(user.id);
  if (quota.remaining <= 0) {
    return NextResponse.json(
      {
        error:
          quota.plan === "free"
            ? `Hai usato i ${quota.limit} disegni gratuiti di oggi. Torna domani oppure passa a Premium!`
            : `Limite giornaliero raggiunto (${quota.limit}).`,
        code: "quota_exceeded",
        quota,
      },
      { status: 429 }
    );
  }

  const admin = createAdminClient();
  const provider = getGenerationProvider();
  const ageBand = demoParsed.data.ageBand;

  // Un disegno da colorare non è personale: se questo soggetto è già stato
  // disegnato lo si riusa, senza chiamare (e pagare) il modello.
  const { template, key } = await findReusable(admin, user.id, prompt, ageBand);

  // Un riuso non costa nulla: volendo si può non farlo pesare sulla quota
  // (CACHE_HITS_FREE=true), così gli utenti gratuiti ottengono di più
  // senza che questo si traduca in spesa.
  const riusoGratuito = Boolean(template) && process.env.CACHE_HITS_FREE === "true";

  // L'evento di generazione viene registrato PRIMA della chiamata al modello:
  // la quota conta i tentativi, così richieste concorrenti non la aggirano.
  let generationId: string | null = null;
  if (!riusoGratuito) {
    const { data: generation, error: genError } = await admin
      .from("generations")
      .insert({
        user_id: user.id,
        provider: provider.name,
        prompt,
        ...(template ? { cached: true } : {}),
      })
      .select("id")
      .single();
    if (genError) {
      return NextResponse.json(
        { error: "Errore interno, riprova" },
        { status: 500 }
      );
    }
    generationId = generation.id;
  }

  try {
    // Riuso: nessuna chiamata al modello, risposta immediata.
    const result = template
      ? { kind: template.kind, content: template.content }
      : await provider.generate(prompt, { ageBand });

    // Bambino richiesto dal client, accettato solo se appartiene all'utente.
    const requestedKid = demoParsed.data.kidId;
    let kidId: string | null = null;
    if (requestedKid) {
      const { data: kid } = await admin
        .from("kid_profiles")
        .select("id")
        .eq("id", requestedKid)
        .eq("user_id", user.id)
        .maybeSingle();
      kidId = kid?.id ?? null;
    }

    // Disegno appena creato: si registra perché altri possano riusarlo.
    const templateId = template
      ? template.id
      : await saveTemplate(admin, {
          key,
          prompt,
          ageBand,
          provider: provider.name,
          kind: result.kind,
          content: result.content,
        });

    // kid_id e template_id inclusi solo se valorizzati: così l'insert
    // funziona anche prima che le migrazioni siano applicate.
    const base = {
      user_id: user.id,
      prompt,
      provider: provider.name,
      kind: result.kind,
      content: result.content,
      ...(kidId ? { kid_id: kidId } : {}),
      ...(templateId ? { template_id: templateId } : {}),
    };

    // Primo tentativo con l'età; se la migrazione 0005 non è ancora
    // applicata la colonna non esiste e si riprova senza, invece di far
    // fallire la creazione del disegno.
    let { data: drawing, error: drawError } = await admin
      .from("drawings")
      .insert({ ...base, age_band: ageBand })
      .select("id")
      .single();
    // La colonna manca finché non si applica la migrazione: si riprova
    // senza i campi nuovi invece di far fallire la creazione.
    if (drawError?.message?.includes("template_id")) {
      delete (base as Record<string, unknown>).template_id;
      ({ data: drawing, error: drawError } = await admin
        .from("drawings")
        .insert({ ...base, age_band: ageBand })
        .select("id")
        .single());
    }
    if (drawError?.message?.includes("age_band")) {
      ({ data: drawing, error: drawError } = await admin
        .from("drawings")
        .insert(base)
        .select("id")
        .single());
    }
    if (drawError || !drawing) {
      throw new Error(drawError?.message ?? "insert fallita");
    }

    if (template) await bumpUses(admin, template.id);

    return NextResponse.json({ id: drawing.id, cached: Boolean(template) });
  } catch (err) {
    // Generazione fallita: l'evento viene rimosso per non consumare quota.
    if (generationId) {
      await admin.from("generations").delete().eq("id", generationId);
    }
    const message =
      err instanceof Error ? err.message : "Generazione non riuscita";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
