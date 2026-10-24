import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { getQuotaStatus } from "@/lib/quota";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  }
  return NextResponse.json(await getQuotaStatus(user.id));
}
