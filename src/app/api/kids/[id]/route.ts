import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { deleteKid } from "@/lib/db/repo";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  }
  try {
    await deleteKid(user.id, id);
  } catch {
    return NextResponse.json({ error: "Rimozione non riuscita" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
