export const OAUTH_COOKIE = "colora_oauth";

// Solo destinazioni interne: nessun redirect verso l'esterno.
export function safeNext(next: string | null): string {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
}
