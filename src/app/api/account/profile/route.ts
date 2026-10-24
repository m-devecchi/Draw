import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/server";
import { setDisplayName } from "@/lib/db/repo";

const bodySchema = z.object({ displayName: z.string().trim().min(1).max(40) });

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  }
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Nome non valido" }, { status: 400 });
  }
  try {
    await setDisplayName(user.id, parsed.data.displayName);
  } catch {
    return NextResponse.json({ error: "Salvataggio fallito" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
