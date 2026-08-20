import { NextResponse } from "next/server";
import { z } from "zod";
import { getGenerationProvider } from "@/lib/generation";
import { getQuotaStatus } from "@/lib/quota";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 300; // la generazione può richiedere qualche minuto

const bodySchema = z.object({
  prompt: z.string().trim().min(2).max(300),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Prompt non valido (2-300 caratteri)" },
      { status: 400 }
    );
  }
  const { prompt } = parsed.data;

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

  // L'evento di generazione viene registrato PRIMA della chiamata al modello:
  // la quota conta i tentativi, così richieste concorrenti non la aggirano.
  const { data: generation, error: genError } = await admin
    .from("generations")
    .insert({ user_id: user.id, provider: provider.name, prompt })
    .select("id")
    .single();
  if (genError) {
    return NextResponse.json(
      { error: "Errore interno, riprova" },
      { status: 500 }
    );
  }

  try {
    const result = await provider.generate(prompt);

    const { data: drawing, error: drawError } = await admin
      .from("drawings")
      .insert({
        user_id: user.id,
        prompt,
        provider: provider.name,
        kind: result.kind,
        content: result.content,
      })
      .select("id")
      .single();
    if (drawError || !drawing) {
      throw new Error(drawError?.message ?? "insert fallita");
    }

    return NextResponse.json({ id: drawing.id });
  } catch (err) {
    // Generazione fallita: l'evento viene rimosso per non consumare quota.
    await admin.from("generations").delete().eq("id", generation.id);
    const message =
      err instanceof Error ? err.message : "Generazione non riuscita";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
