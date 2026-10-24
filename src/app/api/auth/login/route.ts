import { NextResponse } from "next/server";
import { z } from "zod";
import { friendlyError, signInWithPassword } from "@/lib/auth/cognito";
import { writeSession } from "@/lib/auth/session";
import { verifyIdToken } from "@/lib/auth/tokens";
import { isDemoMode } from "@/lib/config";
import { ensureProfile } from "@/lib/db/repo";

const bodySchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1).max(256),
});

export async function POST(request: Request) {
  if (isDemoMode()) {
    return NextResponse.json({ error: "Login non attivo" }, { status: 404 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Email o password non corretti." },
      { status: 400 }
    );
  }

  try {
    const tokens = await signInWithPassword(
      parsed.data.email,
      parsed.data.password
    );
    const user = await verifyIdToken(tokens.idToken);
    if (!user) throw new Error("token non valido");
    // Il profilo si crea al primo accesso (prima lo faceva un trigger).
    await ensureProfile(user.id, user.email);

    const response = NextResponse.json({ ok: true });
    writeSession(response.cookies, tokens);
    return response;
  } catch (err) {
    return NextResponse.json({ error: friendlyError(err) }, { status: 401 });
  }
}
