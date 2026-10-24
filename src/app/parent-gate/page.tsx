import { Emoji } from "@/components/ui/Emoji";
import { redirect } from "next/navigation";
import { ParentGateForm } from "@/components/parent/ParentGateForm";
import { getCurrentUser } from "@/lib/auth/server";
import { getProfile } from "@/lib/db/repo";
import { isDemoMode } from "@/lib/config";
import { createMathChallenge, isParentUnlocked } from "@/lib/parent-gate";

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

  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const next = safeNext((await searchParams).next);
  if (await isParentUnlocked(user.id)) redirect(next);

  const hasPin = Boolean((await getProfile(user.id))?.parentPinHash);

  return (
    <main className="flex min-h-dvh items-center justify-center p-6">
      <div className="ink-card w-full max-w-sm p-7 sm:p-8">
        <div className="mb-6 text-center">
          <Emoji char="🔒" size={72} decorative className="mx-auto mb-2" />
          <h1 className="font-display text-3xl font-semibold">
            Area genitori
          </h1>
          <p className="mt-2 text-sm font-semibold text-ink-soft">
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
