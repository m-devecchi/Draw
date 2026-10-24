import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/server";
import { getProfile } from "@/lib/db/repo";
import { isDemoMode } from "@/lib/config";
import {
  PARENT_COOKIE,
  createUnlockToken,
  verifyMathChallenge,
  verifyPin,
} from "@/lib/parent-gate";

const bodySchema = z.union([
  z.object({ pin: z.string().min(4).max(12) }),
  z.object({ answer: z.number().int(), token: z.string() }),
]);

// Freno ai tentativi: un bambino che prova PIN a caso si ferma presto.
const attempts = new Map<string, { count: number; until: number }>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 5 * 60_000;

function tooManyAttempts(userId: string): boolean {
  const entry = attempts.get(userId);
  if (!entry) return false;
  if (Date.now() > entry.until) {
    attempts.delete(userId);
    return false;
  }
  return entry.count >= MAX_ATTEMPTS;
}

function registerFailure(userId: string) {
  const entry = attempts.get(userId);
  if (!entry || Date.now() > entry.until) {
    attempts.set(userId, { count: 1, until: Date.now() + LOCKOUT_MS });
    return;
  }
  entry.count += 1;
}

export async function POST(request: Request) {
  if (isDemoMode()) {
    return NextResponse.json({ error: "Non disponibile" }, { status: 404 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Richiesta non valida" }, { status: 400 });
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  }

  if (tooManyAttempts(user.id)) {
    return NextResponse.json(
      { error: "Troppi tentativi: riprova tra qualche minuto." },
      { status: 429 }
    );
  }

  const profile = await getProfile(user.id);
  const pinHash: string | null = profile?.parentPinHash ?? null;

  let ok = false;
  if ("pin" in parsed.data) {
    // Con un PIN impostato è l'unica via: niente ripiego sulla matematica.
    ok = verifyPin(parsed.data.pin, pinHash);
  } else if (!pinHash) {
    ok = verifyMathChallenge(parsed.data.answer, parsed.data.token);
  }

  if (!ok) {
    registerFailure(user.id);
    return NextResponse.json(
      { error: pinHash ? "PIN non corretto." : "Risposta non corretta." },
      { status: 401 }
    );
  }

  attempts.delete(user.id);
  const token = createUnlockToken(user.id);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(PARENT_COOKIE, token.value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: token.maxAge,
  });
  return response;
}

// Uscita dall'area genitori (torna alla modalità bambino).
export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(PARENT_COOKIE, "", { path: "/", maxAge: 0 });
  return response;
}
