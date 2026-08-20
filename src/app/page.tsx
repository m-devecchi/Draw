import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AgeChooser } from "@/components/AgeChooser";
import { AGE_COOKIE, parseAgeBand } from "@/lib/age-bands";
import { DrawingCard } from "@/components/DrawingCard";
import { QuotaCrayons } from "@/components/QuotaCrayons";
import { KidSwitcher } from "@/components/KidSwitcher";
import { PromptForm } from "@/components/PromptForm";
import { UpgradeButton } from "@/components/UpgradeButton";
import { DemoHome } from "@/components/demo/DemoHome";
import { isDemoMode } from "@/lib/config";
import { getQuotaStatus } from "@/lib/quota";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ kid?: string }>;
}) {
  if (isDemoMode()) {
    const chosen = parseAgeBand((await cookies()).get(AGE_COOKIE)?.value);
    return (
      <DemoHome
        ageChooser={
          chosen ? null : <AgeChooser current={null} variant="onboarding" />
        }
      />
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Bambino attivo: arriva da ?kid=<id> nell'URL e filtra la galleria.
  // Se la migrazione 0002 non è ancora applicata, kids è null e la
  // funzionalità resta semplicemente spenta.
  const { data: kids } = await supabase
    .from("kid_profiles")
    .select("id, name, avatar")
    .order("created_at");
  const kidsEnabled = Array.isArray(kids);
  const ageBand = parseAgeBand((await cookies()).get(AGE_COOKIE)?.value);
  const requestedKid = (await searchParams).kid ?? null;
  const activeKidId =
    kids?.some((k) => k.id === requestedKid) === true ? requestedKid : null;

  interface DrawingRow {
    id: string;
    prompt: string;
    kind: string;
    created_at: string;
    kid_id?: string | null;
    content: string;
    fills: Record<string, string> | null;
  }

  let drawingsQuery = supabase
    .from("drawings")
    .select(
      kidsEnabled
        ? "id, prompt, kind, created_at, kid_id, content, fills"
        : ("id, prompt, kind, created_at, content, fills" as string)
    )
    .order("created_at", { ascending: false })
    .limit(30);
  if (activeKidId) {
    drawingsQuery = drawingsQuery.eq("kid_id", activeKidId);
  }

  const [quota, drawingsRes] = await Promise.all([
    getQuotaStatus(user.id),
    drawingsQuery,
  ]);
  const drawings = (drawingsRes.data ?? []) as unknown as DrawingRow[];
  const kidById = new Map((kids ?? []).map((k) => [k.id, k]));

  return (
    <main className="mx-auto max-w-3xl p-4 pb-16 sm:p-6">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-extrabold text-crayon-purple">
          🖍️ Colora
        </h1>
        <div className="flex items-center gap-3">
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold ${
              quota.plan === "premium"
                ? "bg-crayon-yellow"
                : "bg-stone-200 text-stone-600"
            }`}
          >
            {quota.plan === "premium" ? "⭐ Premium" : "Free"}
          </span>
          {/* Area genitori: protetta dal cancello parentale */}
          <Link
            href="/parent-gate?next=/account"
            aria-label="Area genitori"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-lg shadow transition active:scale-90"
          >
            🔒
          </Link>
        </div>
      </header>

      {!ageBand && (
        <div className="mb-6">
          <AgeChooser current={null} variant="onboarding" />
        </div>
      )}

      <section className="rounded-3xl bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-2xl font-extrabold">
          {activeKidId
            ? `${kidById.get(activeKidId)?.avatar} Cosa vuoi colorare, ${kidById.get(activeKidId)?.name}?`
            : "Cosa vuoi colorare oggi?"}
        </h2>
        <PromptForm remaining={quota.remaining} kidId={activeKidId} />
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <QuotaCrayons used={quota.usedToday} limit={quota.limit} />
          {quota.plan === "free" && quota.remaining === 0 && <UpgradeButton />}
        </div>
      </section>

      {(kids?.length ?? 0) > 0 && (
        <div className="mt-6">
          <KidSwitcher kids={kids ?? []} activeKidId={activeKidId} />
        </div>
      )}

      <section className="mt-8">
        <h2 className="mb-3 text-xl font-extrabold">
          {activeKidId
            ? `I disegni di ${kidById.get(activeKidId)?.name ?? ""}`
            : "I tuoi disegni"}
        </h2>
        {!drawings?.length ? (
          <div className="rounded-3xl bg-white/60 p-8 text-center text-stone-400">
            {activeKidId ? (
              <>
                <p>
                  {kidById.get(activeKidId)?.name} non ha ancora disegni
                  suoi. 🎨
                </p>
                <p className="mt-1 text-sm">
                  Creane uno qui sopra, oppure{" "}
                  <Link href="/" className="font-bold underline">
                    guarda tutti i disegni
                  </Link>
                  .
                </p>
              </>
            ) : (
              <p>Ancora nessun disegno: creane uno qui sopra! 🎨</p>
            )}
          </div>
        ) : (
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {drawings.map((d) => (
              <DrawingCard
                key={d.id}
                id={d.id}
                prompt={d.prompt}
                content={d.content}
                fills={d.fills ?? {}}
                createdAt={d.created_at}
                badge={
                  d.kid_id ? kidById.get(d.kid_id)?.avatar ?? undefined : undefined
                }
                href={
                  activeKidId
                    ? `/color/${d.id}?kid=${encodeURIComponent(activeKidId)}`
                    : `/color/${d.id}`
                }
              />
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
