// Modalità dell'app:
// - PoC/demo: backend AWS NON configurato → niente login, disegni in
//   localStorage, limite giornaliero best-effort per IP.
// - Completa: Cognito + Aurora configurati → login, quota per utente,
//   persistenza, Stripe (se configurato).
// La stessa codebase copre entrambe: il PoC è il punto di partenza verso
// l'architettura enterprise, non un progetto separato.
//
// Niente import da db/client: questo file gira anche nel middleware (edge)
// e non deve portarsi dietro l'SDK AWS.
export function isBackendConfigured(): boolean {
  const auth = Boolean(
    process.env.COGNITO_USER_POOL_ID && process.env.COGNITO_CLIENT_ID
  );
  const db = Boolean(
    process.env.DATABASE_URL ||
      (process.env.DB_CLUSTER_ARN && process.env.DB_SECRET_ARN)
  );
  return auth && db;
}

export function isDemoMode(): boolean {
  return !isBackendConfigured();
}
