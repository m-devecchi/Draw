import { NextResponse } from "next/server";
import { z } from "zod";
import { createConfirmedUser } from "@/lib/auth/cognito-admin";
import { CognitoError, friendlyError } from "@/lib/auth/cognito";
import { isDemoMode } from "@/lib/config";

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
 * Registrazione senza conferma via email: il server crea l'utente su
 * Cognito già confermato, poi il client accede con email e password.
 */
export async function POST(request: Request) {
  if (isDemoMode()) {
    return NextResponse.json({ error: "Login non attivo" }, { status: 404 });
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
  try {
    await createConfirmedUser(email, password);
  } catch (err) {
    const exists =
      err instanceof Error && err.name === "UsernameExistsException";
    return NextResponse.json(
      {
        error: exists
          ? friendlyError(new CognitoError("UsernameExistsException", ""))
          : "Registrazione non riuscita, riprova.",
      },
      { status: exists ? 409 : 500 }
    );
  }

  recent.get(ip)?.push(Date.now());
  return NextResponse.json({ ok: true });
}
