import { redirect } from "next/navigation";
import { ParentGateForm } from "@/components/parent/ParentGateForm";
import { isDemoMode } from "@/lib/config";
import { createMathChallenge, isParentUnlocked } from "@/lib/parent-gate";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// Solo destinazioni interne: nessun redirect verso l'esterno.
function safeNext(next: string | undefined): string {
  return next && next.startsWith("/") && !next.startsWith("//")
    ? next
    : "/account";
}

export default async function ParentGatePage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  if (isDemoMode()) redirect("/");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const next = safeNext((await searchParams).next);
  if (await isParentUnlocked(user.id)) redirect(next);

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("parent_pin_hash")
    .eq("id", user.id)
    .single();
  const hasPin = Boolean(profile?.parent_pin_hash);

  return (
    <main className="flex min-h-dvh items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-xl">
        <div className="mb-6 text-center">
          <div className="mb-2 text-5xl">🔒</div>
          <h1 className="text-2xl font-extrabold text-crayon-purple">
            Area genitori
          </h1>
          <p className="mt-2 text-sm text-stone-500">
            {hasPin
              ? "Inserisci il PIN per continuare."
              : "Rispondi alla domanda per continuare."}
          </p>
        </div>
        <ParentGateForm
          hasPin={hasPin}
          challenge={hasPin ? null : createMathChallenge()}
          next={next}
        />
      </div>
    </main>
  );
}
