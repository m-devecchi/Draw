import { createRemoteJWKSet, jwtVerify } from "jose";
import { clientId, poolId, region } from "./cognito";

// Verifica dei token Cognito (firma, scadenza, emittente, destinatario).
// Usa solo jose + fetch: gira anche nel middleware (edge).

export interface AuthUser {
  /** "sub" di Cognito: e' l'id dell'utente in tutto il database. */
  id: string;
  email: string | null;
}

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

function issuer(): string {
  return `https://cognito-idp.${region()}.amazonaws.com/${poolId()}`;
}

/** Restituisce l'utente se l'ID token e' valido e non scaduto, altrimenti null. */
export async function verifyIdToken(token: string): Promise<AuthUser | null> {
  try {
    jwks ??= createRemoteJWKSet(new URL(`${issuer()}/.well-known/jwks.json`));
    const { payload } = await jwtVerify(token, jwks, {
      issuer: issuer(),
      audience: clientId(),
    });
    if (payload.token_use !== "id" || typeof payload.sub !== "string") {
      return null;
    }
    return {
      id: payload.sub,
      email: typeof payload.email === "string" ? payload.email : null,
    };
  } catch {
    return null;
  }
}
