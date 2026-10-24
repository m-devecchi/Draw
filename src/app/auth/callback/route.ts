import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { exchangeOAuthCode } from "@/lib/auth/cognito";
import { OAUTH_COOKIE, safeNext } from "@/lib/auth/oauth";
import { writeSession } from "@/lib/auth/session";
import { verifyIdToken } from "@/lib/auth/tokens";
import { ensureProfile } from "@/lib/db/repo";

// Ritorno dal login con Google / Apple: scambia il codice con i token
// (verificando state e PKCE) e apre la sessione.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  const store = await cookies();
  const raw = store.get(OAUTH_COOKIE)?.value;
  let saved: { verifier: string; state: string; next: string } | null = null;
  try {
    saved = raw ? JSON.parse(raw) : null;
  } catch {
    saved = null;
  }

  const fail = NextResponse.redirect(`${origin}/login`);
  fail.cookies.set(OAUTH_COOKIE, "", { path: "/", maxAge: 0 });
  if (!code || !saved || saved.state !== state) return fail;

  try {
    const tokens = await exchangeOAuthCode(
      code,
      saved.verifier,
      `${origin}/auth/callback`
    );
    const user = await verifyIdToken(tokens.idToken);
    if (!user) return fail;
    await ensureProfile(user.id, user.email);

    const response = NextResponse.redirect(`${origin}${safeNext(saved.next)}`);
    writeSession(response.cookies, tokens);
    response.cookies.set(OAUTH_COOKIE, "", { path: "/", maxAge: 0 });
    return response;
  } catch {
    return fail;
  }
}
