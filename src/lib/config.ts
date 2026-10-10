// Modalità dell'app:
// - PoC/demo: Supabase NON configurato → niente login, disegni in
//   localStorage, limite giornaliero best-effort per IP.
// - Completa: Supabase configurato → login, quota per utente, persistenza,
//   Stripe (se configurato).
// La stessa codebase copre entrambe: il PoC è il punto di partenza verso
// l'architettura enterprise, non un progetto separato.
export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(url && key && !url.includes("xxxx"));
}

export function isDemoMode(): boolean {
  return !isSupabaseConfigured();
}

// Conferma della registrazione via email. Spenta di serie in questa fase:
// l'account viene creato dal server già confermato, qualunque sia
// l'impostazione "Confirm email" del pannello Supabase. Con
// REQUIRE_EMAIL_CONFIRMATION=true si torna al flusso classico (email con
// link di conferma).
export function requireEmailConfirmation(): boolean {
  return process.env.REQUIRE_EMAIL_CONFIRMATION === "true";
}
