import { cookies } from "next/headers";
import { ACCESS_COOKIE, ID_COOKIE } from "./session";
import { verifyIdToken, type AuthUser } from "./tokens";

export type { AuthUser } from "./tokens";

/**
 * Utente autenticato della richiesta corrente, o null.
 * Il middleware rinfresca i token scaduti prima che si arrivi qui.
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const store = await cookies();
  const token = store.get(ID_COOKIE)?.value;
  return token ? verifyIdToken(token) : null;
}

/** Access token della sessione (serve per cambiare password/email). */
export async function getAccessToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(ACCESS_COOKIE)?.value ?? null;
}
