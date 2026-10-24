import { NextResponse } from "next/server";
import { z } from "zod";
import { forgotPassword } from "@/lib/auth/cognito";
import { isDemoMode } from "@/lib/config";

const bodySchema = z.object({ email: z.string().trim().toLowerCase().email() });

// Invia il codice di recupero password. Risponde sempre ok: non si
// rivela se un indirizzo ha un account.
export async function POST(request: Request) {
  if (isDemoMode()) {
    return NextResponse.json({ error: "Login non attivo" }, { status: 404 });
  }
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Email non valida" }, { status: 400 });
  }
  try {
    await forgotPassword(parsed.data.email);
  } catch (err) {
    if (err instanceof Error && /Limit|TooMany/.test(err.name + err.message)) {
      return NextResponse.json(
        { error: "Troppi tentativi: riprova tra qualche minuto." },
        { status: 429 }
      );
    }
  }
  return NextResponse.json({ ok: true });
}
