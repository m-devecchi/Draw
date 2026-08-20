import { cookies } from "next/headers";
import { PARENT_COOKIE, isTokenValid } from "./parent-gate-tokens";

// Lato server (Server Component / route handler): legge il cookie di
// sblocco. Le primitive crittografiche stanno in parent-gate-tokens.ts,
// senza dipendenze da Next, cosi' sono verificabili in isolamento.
export * from "./parent-gate-tokens";

/** true se il genitore ha sbloccato di recente (cookie firmato valido). */
export async function isParentUnlocked(userId: string): Promise<boolean> {
  const store = await cookies();
  return isTokenValid(store.get(PARENT_COOKIE)?.value, userId);
}
