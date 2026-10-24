import { NextResponse } from "next/server";
import { z } from "zod";
import { changePassword, friendlyError } from "@/lib/auth/cognito";
import { getAccessToken, getCurrentUser } from "@/lib/auth/server";

const bodySchema = z.object({
  current: z.string().min(1).max(256),
  password: z.string().min(8, "Minimo 8 caratteri").max(72),
});

export async function POST(request: Request) {
  const user = await getCurrentUser();
  const accessToken = await getAccessToken();
  if (!user || !accessToken) {
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  }
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dati non validi" },
      { status: 400 }
    );
  }
  try {
    await changePassword(accessToken, parsed.data.current, parsed.data.password);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message =
      err instanceof Error && err.name === "NotAuthorizedException"
        ? "La password attuale non è corretta."
        : friendlyError(err);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
