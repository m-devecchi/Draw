import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/server";
import { addKid } from "@/lib/db/repo";

const bodySchema = z.object({
  name: z.string().trim().min(1).max(30),
  avatar: z.string().min(1).max(8),
});

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  }
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Dati non validi" }, { status: 400 });
  }
  try {
    const kid = await addKid(user.id, parsed.data.name, parsed.data.avatar);
    return NextResponse.json(kid);
  } catch {
    return NextResponse.json({ error: "Aggiunta non riuscita" }, { status: 500 });
  }
}
