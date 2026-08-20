import { NextResponse } from "next/server";
import { z } from "zod";
import { isDemoMode } from "@/lib/config";
import { hashPin, isParentUnlocked, verifyPin } from "@/lib/parent-gate";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  // Solo cifre: la tastiera numerica è più comoda e il PIN resta semplice.
  pin: z.string().regex(/^\d{4,8}$/, "Il PIN deve avere da 4 a 8 cifre"),
  currentPin: z.string().optional(),
});

// Imposta o cambia il PIN genitore (scritto solo dal server, service role).
export async function POST(request: Request) {
  if (isDemoMode()) {
    return NextResponse.json({ error: "Non disponibile" }, { status: 404 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Richiesta non valida" },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("parent_pin_hash")
    .eq("id", user.id)
    .single();
  const existing: string | null = profile?.parent_pin_hash ?? null;

  // Per cambiare un PIN esistente serve quello vecchio (oppure una
  // sessione genitore già sbloccata).
  if (existing) {
    const unlocked = await isParentUnlocked(user.id);
    const currentOk =
      parsed.data.currentPin !== undefined &&
      verifyPin(parsed.data.currentPin, existing);
    if (!unlocked && !currentOk) {
      return NextResponse.json(
        { error: "Serve il PIN attuale." },
        { status: 401 }
      );
    }
  }

  const { error } = await admin
    .from("profiles")
    .update({ parent_pin_hash: hashPin(parsed.data.pin) })
    .eq("id", user.id);
  if (error) {
    return NextResponse.json(
      { error: "Salvataggio non riuscito, riprova" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
