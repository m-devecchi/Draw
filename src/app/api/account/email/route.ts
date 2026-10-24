import { NextResponse } from "next/server";
import { z } from "zod";
import {
  confirmEmailChange,
  friendlyError,
  refreshSession,
  requestEmailChange,
} from "@/lib/auth/cognito";
import { getAccessToken, getCurrentUser } from "@/lib/auth/server";
import { REFRESH_COOKIE, writeSession } from "@/lib/auth/session";
import { verifyIdToken } from "@/lib/auth/tokens";
import { cookies } from "next/headers";
import { setEmail } from "@/lib/db/repo";

// Cambio email in due passi: Cognito manda un codice al NUOVO indirizzo
// (POST), poi l'utente lo inserisce (PUT) e l'email cambia.

export async function POST(request: Request) {
  const accessToken = await getAccessToken();
  if (!(await getCurrentUser()) || !accessToken) {
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  }
  const parsed = z
    .object({ email: z.string().trim().toLowerCase().email() })
    .safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Email non valida" }, { status: 400 });
  }
  try {
    await requestEmailChange(accessToken, parsed.data.email);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: friendlyError(err) }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  const user = await getCurrentUser();
  const accessToken = await getAccessToken();
  if (!user || !accessToken) {
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  }
  const parsed = z
    .object({ code: z.string().trim().regex(/^\d{4,10}$/) })
    .safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Codice non valido" }, { status: 400 });
  }
  try {
    await confirmEmailChange(accessToken, parsed.data.code);

    // I token in circolazione hanno ancora la vecchia email: si rinfrescano.
    const refresh = (await cookies()).get(REFRESH_COOKIE)?.value;
    const response = NextResponse.json({ ok: true });
    if (refresh) {
      const tokens = await refreshSession(refresh);
      writeSession(response.cookies, tokens);
      const updated = await verifyIdToken(tokens.idToken);
      if (updated?.email) await setEmail(user.id, updated.email);
    }
    return response;
  } catch (err) {
    return NextResponse.json({ error: friendlyError(err) }, { status: 400 });
  }
}
