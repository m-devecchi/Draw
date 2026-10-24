import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/server";
import { getProfile, setParentPinHash } from "@/lib/db/repo";
import { isDemoMode } from "@/lib/config";
import { hashPin, isParentUnlocked, verifyPin } from "@/lib/parent-gate";

const bodySchema = z.object({
  // Solo cifre: la tastiera numerica è più comoda e il PIN resta semplice.
  pin: z.string().regex(/^\d{4,8}$/, "Il PIN deve avere da 4 a 8 cifre"),
  currentPin: z.string().optional(),
});

// Imposta o cambia il PIN genitore (scritto solo dal server).
export async function POST(request: Request) {
  if (isDemoMode()) {
    return NextResponse.json({ error: "Non disponibile" }, { status: 404 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Richiesta non valida" },
      { status: 400 }
    );
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  }

  const profile = await getProfile(user.id);
  const existing: string | null = profile?.parentPinHash ?? null;

  // Per cambiare un PIN esistente serve quello vecchio (oppure una
  // sessione genitore già sbloccata).
  if (existing) {
    const unlocked = await isParentUnlocked(user.id);
    const currentOk =
      parsed.data.currentPin !== undefined &&
      verifyPin(parsed.data.currentPin, existing);
    if (!unlocked && !currentOk) {
      return NextResponse.json(
        { error: "Serve il PIN attuale." },
        { status: 401 }
      );
    }
  }

  try {
    await setParentPinHash(user.id, hashPin(parsed.data.pin));
  } catch {
    return NextResponse.json(
      { error: "Salvataggio non riuscito, riprova" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
