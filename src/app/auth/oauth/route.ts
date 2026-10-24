import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { clientId, hostedUiBase } from "@/lib/auth/cognito";
import { OAUTH_COOKIE, safeNext } from "@/lib/auth/oauth";
import { isDemoMode } from "@/lib/config";

const PROVIDERS: Record<string, string> = { google: "Google", apple: "SignInWithApple" };

function b64url(buf: Buffer): string {
  return buf.toString("base64url");
}

// Avvia il login con Google / Apple tramite la Hosted UI di Cognito
// (flusso a codice con PKCE).
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  if (isDemoMode()) return NextResponse.redirect(`${origin}/`);

  const provider = PROVIDERS[searchParams.get("provider") ?? ""];
  if (!provider) return NextResponse.redirect(`${origin}/login`);

  const verifier = b64url(randomBytes(32));
  const state = b64url(randomBytes(16));
  const challenge = b64url(createHash("sha256").update(verifier).digest());
  const redirectUri = `${origin}/auth/callback`;

  const url = new URL(`${hostedUiBase()}/oauth2/authorize`);
  url.search = new URLSearchParams({
    response_type: "code",
    client_id: clientId(),
    redirect_uri: redirectUri,
    scope: "openid email profile",
    identity_provider: provider,
    state,
    code_challenge: challenge,
    code_challenge_method: "S256",
  }).toString();

  const response = NextResponse.redirect(url.toString());
  response.cookies.set(
    OAUTH_COOKIE,
    JSON.stringify({ verifier, state, next: safeNext(searchParams.get("next")) }),
    {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 600,
    }
  );
  return response;
}
