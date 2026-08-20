import { NextResponse } from "next/server";
import { isDemoMode } from "@/lib/config";
import { isParentUnlocked } from "@/lib/parent-gate";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// Eliminazione definitiva dell'account: rimuove l'utente auth e, a cascata
// (foreign key on delete cascade), profilo, disegni ed eventi di generazione.
export async function POST() {
  if (isDemoMode()) {
    return NextResponse.json({ error: "Non disponibile in demo" }, { status: 404 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  }

  if (!(await isParentUnlocked(user.id))) {
    return NextResponse.json(
      { error: "Serve l'area genitori.", needsParent: true },
      { status: 403 }
    );
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    return NextResponse.json(
      { error: "Eliminazione non riuscita, riprova" },
      { status: 500 }
    );
  }

  // Pulisce i cookie di sessione ormai orfani.
  await supabase.auth.signOut();
  return NextResponse.json({ ok: true });
}
