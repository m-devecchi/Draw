import { NextResponse } from "next/server";
import { z } from "zod";
import { isDemoMode, requireEmailConfirmation } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";

const bodySchema = z.object({
  email: z.string().trim().toLowerCase().email("Email non valida"),
  password: z
    .string()
    .min(8, "La password deve avere almeno 8 caratteri")
    .max(72, "Password troppo lunga"),
});

// Freno alle registrazioni a raffica dallo stesso indirizzo: senza
// conferma via email, ogni account nuovo porta con sé disegni gratuiti.
const recent = new Map<string, number[]>();
const MAX_PER_HOUR = 5;

function tooMany(ip: string): boolean {
  const hourAgo = Date.now() - 3_600_000;
  const hits = (recent.get(ip) ?? []).filter((t) => t > hourAgo);
  recent.set(ip, hits);
  return hits.length >= MAX_PER_HOUR;
}

/**
 * Registrazione senza conferma via email: il server crea l'account già
 * confermato (service role), poi il client accede con email e password.
 * Se la conferma è richiesta risponde { confirm: true } e il client usa
 * il flusso classico di Supabase.
 */
export async function POST(request: Request) {
  if (isDemoMode()) {
    return NextResponse.json({ error: "Login non attivo" }, { status: 404 });
  }
  if (requireEmailConfirmation()) {
    return NextResponse.json({ confirm: true });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dati non validi" },
      { status: 400 }
    );
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (tooMany(ip)) {
    return NextResponse.json(
      { error: "Troppe registrazioni da questa rete, riprova più tardi." },
      { status: 429 }
    );
  }

  const { email, password } = parsed.data;
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error) {
    const exists =
      error.status === 422 ||
      /already (been )?registered|already exists/i.test(error.message);
    return NextResponse.json(
      {
        error: exists
          ? "Esiste già un account con questa email: accedi."
          : "Registrazione non riuscita, riprova.",
      },
      { status: exists ? 409 : 500 }
    );
  }

  recent.get(ip)?.push(Date.now());
  return NextResponse.json({ ok: true });
}
