import { NextResponse } from "next/server";
import { clearSession } from "@/lib/auth/session";
import { deleteCognitoUser } from "@/lib/auth/cognito-admin";
import { getCurrentUser } from "@/lib/auth/server";
import { deleteProfile } from "@/lib/db/repo";
import { isDemoMode } from "@/lib/config";
import { isParentUnlocked } from "@/lib/parent-gate";

// Eliminazione definitiva dell'account: rimuove profilo, bambini, disegni ed eventi di generazione (a cascata)
// e poi l'utente su Cognito.
export async function POST() {
  if (isDemoMode()) {
    return NextResponse.json({ error: "Non disponibile in demo" }, { status: 404 });
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  }

  if (!(await isParentUnlocked(user.id))) {
    return NextResponse.json(
      { error: "Serve l'area genitori.", needsParent: true },
      { status: 403 }
    );
  }

  try {
    // Prima i dati (a cascata: bambini, disegni, generazioni), poi l'utente.
    await deleteProfile(user.id);
    await deleteCognitoUser(user.id);
  } catch {
    return NextResponse.json(
      { error: "Eliminazione non riuscita, riprova" },
      { status: 500 }
    );
  }

  // Pulisce i cookie di sessione ormai orfani.
  const response = NextResponse.json({ ok: true });
  clearSession(response.cookies);
  return response;
}
