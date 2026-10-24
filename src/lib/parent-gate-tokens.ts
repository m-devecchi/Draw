import {
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "crypto";

// ── Cancello parentale: primitive crittografiche ────────────────────────
// Protegge impostazioni, pagamenti ed eliminazioni: il bambino usa l'app,
// il genitore accede alla parte "seria" con PIN (o, se non l'ha ancora
// impostato, con una domanda di matematica).
//
// Lo sblocco vive in un cookie httpOnly FIRMATO lato server: un cookie
// contraffatto dal browser non supera la verifica della firma.

export const PARENT_COOKIE = "colora_parent";
const UNLOCK_MINUTES = 15;

function secret(): string {
  const s = process.env.PARENT_GATE_SECRET;
  if (!s) {
    throw new Error(
      "Cancello parentale non configurato: manca PARENT_GATE_SECRET"
    );
  }
  return s;
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

// ── PIN ─────────────────────────────────────────────────────────────────

export function hashPin(pin: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(pin, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

export function verifyPin(pin: string, stored: string | null): boolean {
  if (!stored) return false;
  const [scheme, salt, hash] = stored.split("$");
  if (scheme !== "scrypt" || !salt || !hash) return false;
  return safeEqual(scryptSync(pin, salt, 64).toString("hex"), hash);
}

// ── Token di sblocco (cookie) ───────────────────────────────────────────

export function createUnlockToken(userId: string): {
  value: string;
  maxAge: number;
} {
  const expiry = Date.now() + UNLOCK_MINUTES * 60_000;
  const payload = `${userId}.${expiry}`;
  return {
    value: `${expiry}.${sign(payload)}`,
    maxAge: UNLOCK_MINUTES * 60,
  };
}

export function isTokenValid(
  token: string | undefined,
  userId: string
): boolean {
  if (!token) return false;
  const [expiryRaw, signature] = token.split(".");
  const expiry = Number(expiryRaw);
  if (!Number.isFinite(expiry) || !signature) return false;
  if (Date.now() > expiry) return false;
  return safeEqual(sign(`${userId}.${expiry}`), signature);
}

// ── Sfida di matematica (quando il PIN non è ancora impostato) ──────────
// La risposta non viaggia mai al client: il token è l'HMAC della risposta,
// così il server verifica senza dover memorizzare nulla.

export interface MathChallenge {
  a: number;
  b: number;
  token: string;
}

export function createMathChallenge(): MathChallenge {
  const a = 3 + Math.floor(Math.random() * 7); // 3..9
  const b = 3 + Math.floor(Math.random() * 7); // 3..9
  const expiry = Date.now() + 5 * 60_000;
  return { a, b, token: `${expiry}.${sign(`${a * b}.${expiry}`)}` };
}

export function verifyMathChallenge(answer: number, token: string): boolean {
  const [expiryRaw, signature] = token.split(".");
  const expiry = Number(expiryRaw);
  if (!Number.isFinite(expiry) || !signature) return false;
  if (Date.now() > expiry) return false;
  return safeEqual(sign(`${answer}.${expiry}`), signature);
}
