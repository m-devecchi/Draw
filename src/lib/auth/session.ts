import type { Tokens } from "./cognito";

// Cookie di sessione. Tutti httpOnly: il JavaScript del browser non vede
// mai i token.
export const ID_COOKIE = "colora_id";
export const ACCESS_COOKIE = "colora_at";
export const REFRESH_COOKIE = "colora_rt";

const REFRESH_DAYS = 30;

interface CookieSetter {
  set(
    name: string,
    value: string,
    options: {
      httpOnly: boolean;
      sameSite: "lax";
      secure: boolean;
      path: string;
      maxAge: number;
    }
  ): unknown;
}

function options(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}

export function writeSession(jar: CookieSetter, tokens: Tokens) {
  // I token durano ~1 ora: il cookie resta un po' di piu', cosi' il
  // middleware vede il token scaduto e lo rinfresca col refresh token.
  const life = tokens.expiresIn + 24 * 3600;
  jar.set(ID_COOKIE, tokens.idToken, options(life));
  jar.set(ACCESS_COOKIE, tokens.accessToken, options(life));
  if (tokens.refreshToken) {
    jar.set(REFRESH_COOKIE, tokens.refreshToken, options(REFRESH_DAYS * 86400));
  }
}

export function clearSession(jar: CookieSetter) {
  for (const name of [ID_COOKIE, ACCESS_COOKIE, REFRESH_COOKIE]) {
    jar.set(name, "", options(0));
  }
}
