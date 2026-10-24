import { NextResponse } from "next/server";
import { z } from "zod";
import { confirmForgotPassword, friendlyError } from "@/lib/auth/cognito";
import { isDemoMode } from "@/lib/config";

const bodySchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  code: z.string().trim().regex(/^\d{4,10}$/, "Il codice è fatto di cifre"),
  password: z.string().min(8, "Minimo 8 caratteri").max(72),
});

// Imposta la nuova password con il codice ricevuto per email.
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
  try {
    await confirmForgotPassword(
      parsed.data.email,
      parsed.data.code,
      parsed.data.password
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: friendlyError(err) }, { status: 400 });
  }
}
