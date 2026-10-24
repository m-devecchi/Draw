// Client Cognito per le operazioni dell'utente, via fetch: nessuna
// credenziale AWS (le firma Cognito stesso con password/token), quindi
// funziona anche nel middleware (edge). Le operazioni da amministratore
// (creare/eliminare utenti) stanno in cognito-admin.ts.

export class CognitoError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

export interface Tokens {
  accessToken: string;
  idToken: string;
  /** Assente quando si rinfresca: il refresh token resta quello di prima. */
  refreshToken?: string;
  expiresIn: number;
}

export function poolId(): string {
  const v = process.env.COGNITO_USER_POOL_ID;
  if (!v) throw new Error("COGNITO_USER_POOL_ID mancante");
  return v;
}

export function clientId(): string {
  const v = process.env.COGNITO_CLIENT_ID;
  if (!v) throw new Error("COGNITO_CLIENT_ID mancante");
  return v;
}

export function region(): string {
  return process.env.COGNITO_REGION ?? poolId().split("_")[0];
}

async function call<T>(target: string, body: object): Promise<T> {
  const res = await fetch(`https://cognito-idp.${region()}.amazonaws.com/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-amz-json-1.1",
      "X-Amz-Target": `AWSCognitoIdentityProviderService.${target}`,
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const data = (await res.json().catch(() => ({}))) as {
    __type?: string;
    message?: string;
  };
  if (!res.ok) {
    throw new CognitoError(
      data.__type?.split("#").pop() ?? "UnknownError",
      data.message ?? ""
    );
  }
  return data as T;
}

interface AuthResult {
  AuthenticationResult?: {
    AccessToken: string;
    IdToken: string;
    RefreshToken?: string;
    ExpiresIn: number;
  };
  ChallengeName?: string;
}

function toTokens(res: AuthResult): Tokens {
  const r = res.AuthenticationResult;
  if (!r) {
    // Sfide (MFA, cambio password forzato) non previste in questa app.
    throw new CognitoError(
      "ChallengeNotSupported",
      res.ChallengeName ?? "challenge"
    );
  }
  return {
    accessToken: r.AccessToken,
    idToken: r.IdToken,
    refreshToken: r.RefreshToken,
    expiresIn: r.ExpiresIn,
  };
}

export async function signInWithPassword(
  email: string,
  password: string
): Promise<Tokens> {
  return toTokens(
    await call<AuthResult>("InitiateAuth", {
      AuthFlow: "USER_PASSWORD_AUTH",
      ClientId: clientId(),
      AuthParameters: { USERNAME: email, PASSWORD: password },
    })
  );
}

export async function refreshSession(refreshToken: string): Promise<Tokens> {
  return toTokens(
    await call<AuthResult>("InitiateAuth", {
      AuthFlow: "REFRESH_TOKEN_AUTH",
      ClientId: clientId(),
      AuthParameters: { REFRESH_TOKEN: refreshToken },
    })
  );
}

export async function globalSignOut(accessToken: string) {
  await call("GlobalSignOut", { AccessToken: accessToken });
}

export async function forgotPassword(email: string) {
  await call("ForgotPassword", { ClientId: clientId(), Username: email });
}

export async function confirmForgotPassword(
  email: string,
  code: string,
  password: string
) {
  await call("ConfirmForgotPassword", {
    ClientId: clientId(),
    Username: email,
    ConfirmationCode: code,
    Password: password,
  });
}

export async function changePassword(
  accessToken: string,
  previousPassword: string,
  proposedPassword: string
) {
  await call("ChangePassword", {
    AccessToken: accessToken,
    PreviousPassword: previousPassword,
    ProposedPassword: proposedPassword,
  });
}

/** Avvia il cambio email: Cognito manda un codice al nuovo indirizzo. */
export async function requestEmailChange(accessToken: string, email: string) {
  await call("UpdateUserAttributes", {
    AccessToken: accessToken,
    UserAttributes: [{ Name: "email", Value: email }],
  });
}

export async function confirmEmailChange(accessToken: string, code: string) {
  await call("VerifyUserAttribute", {
    AccessToken: accessToken,
    AttributeName: "email",
    Code: code,
  });
}

// ── Login con Google / Apple (Hosted UI, flusso a codice con PKCE) ──────

export function hostedUiBase(): string {
  const d = process.env.COGNITO_DOMAIN;
  if (!d) throw new Error("COGNITO_DOMAIN mancante");
  return d.startsWith("http") ? d : `https://${d}`;
}

export async function exchangeOAuthCode(
  code: string,
  codeVerifier: string,
  redirectUri: string
): Promise<Tokens> {
  const res = await fetch(`${hostedUiBase()}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: clientId(),
      code,
      code_verifier: codeVerifier,
      redirect_uri: redirectUri,
    }),
    cache: "no-store",
  });
  const data = (await res.json().catch(() => ({}))) as {
    access_token?: string;
    id_token?: string;
    refresh_token?: string;
    expires_in?: number;
    error?: string;
  };
  if (!res.ok || !data.id_token || !data.access_token) {
    throw new CognitoError(data.error ?? "OAuthError", "scambio codice fallito");
  }
  return {
    accessToken: data.access_token,
    idToken: data.id_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in ?? 3600,
  };
}

// ── Messaggi per l'utente ───────────────────────────────────────────────

export function friendlyError(err: unknown): string {
  const code = err instanceof CognitoError ? err.code : "";
  switch (code) {
    case "NotAuthorizedException":
    case "UserNotFoundException":
      return "Email o password non corretti.";
    case "UserNotConfirmedException":
      return "Questo account non è ancora confermato: scrivici e lo sblocchiamo.";
    case "UsernameExistsException":
      return "Esiste già un account con questa email: accedi.";
    case "InvalidPasswordException":
      return "Password non accettata: usa almeno 8 caratteri.";
    case "CodeMismatchException":
      return "Il codice non è corretto.";
    case "ExpiredCodeException":
      return "Il codice è scaduto: richiedine uno nuovo.";
    case "LimitExceededException":
    case "TooManyRequestsException":
    case "TooManyFailedAttemptsException":
      return "Troppi tentativi: riprova tra qualche minuto.";
    case "AliasExistsException":
      return "Questa email è già usata da un altro account.";
    default:
      return "Qualcosa è andato storto, riprova.";
  }
}
