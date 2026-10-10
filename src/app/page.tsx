import Link from "next/link";
import { redirect } from "next/navigation";
import { DrawingGallery } from "@/components/DrawingGallery";
import { QuotaCrayons } from "@/components/QuotaCrayons";
import { KidSwitcher } from "@/components/KidSwitcher";
import { PromptForm } from "@/components/PromptForm";
import { UpgradeButton } from "@/components/UpgradeButton";
import { DemoHome } from "@/components/demo/DemoHome";
import { EmptyGallery } from "@/components/fun/EmptyGallery";
import { Logo } from "@/components/fun/Logo";
import { PlayfulBackdrop } from "@/components/fun/PlayfulBackdrop";
import { isDemoMode } from "@/lib/config";
import { parseStrokes } from "@/lib/strokes";
import { getQuotaStatus } from "@/lib/quota";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ kid?: string }>;
}) {
  if (isDemoMode()) return <DemoHome />;

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
    strokes?: unknown;
  }

  let drawingsQuery = supabase
    .from("drawings")
    .select(
      kidsEnabled
        ? "id, prompt, kind, created_at, kid_id, content, fills, strokes"
        : ("id, prompt, kind, created_at, content, fills, strokes" as string)
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
    <main className="relative mx-auto max-w-3xl p-4 pb-16 sm:p-6">
      <PlayfulBackdrop />
      <header className="mb-6 flex items-center justify-between">
        <Logo />
        <div className="flex items-center gap-3">
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold ${
              quota.plan === "premium"
                ? "bg-crayon-yellow shadow-[0_3px_0_#e0a800]"
                : "bg-white text-stone-600 shadow-[0_3px_0_#e7e5e4]"
            }`}
          >
            {quota.plan === "premium" ? "⭐ Premium" : "Free"}
          </span>
          {/* Area genitori: protetta dal cancello parentale */}
          <Link
            href="/parent-gate?next=/account"
            aria-label="Area genitori"
            className="btn-candy flex h-11 w-11 items-center justify-center rounded-full bg-white text-lg"
          >
            🔒
          </Link>
        </div>
      </header>

      <section className="card-sticker pop-in rounded-[2rem] bg-white/95 p-6 backdrop-blur">
        <h2 className="mb-4 font-display text-3xl font-semibold leading-tight">
          {activeKidId ? (
            `${kidById.get(activeKidId)?.avatar} Cosa vuoi colorare, ${kidById.get(activeKidId)?.name}?`
          ) : (
            <>
              Cosa vuoi <span className="rainbow-text">colorare</span> oggi?
            </>
          )}
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
        <h2 className="mb-3 font-display text-2xl font-semibold">
          {activeKidId
            ? `I disegni di ${kidById.get(activeKidId)?.name ?? ""}`
            : "I tuoi disegni"}
        </h2>
        {!drawings?.length ? (
          <EmptyGallery>
            {activeKidId ? (
              <>
                <p>
                  {kidById.get(activeKidId)?.name} non ha ancora disegni
                  suoi.
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
              <p className="font-bold">
                Ancora nessun disegno: creane uno qui sopra!
              </p>
            )}
          </EmptyGallery>
        ) : (
          <DrawingGallery
            mode="cloud"
            hrefSuffix={
              activeKidId ? `?kid=${encodeURIComponent(activeKidId)}` : ""
            }
            drawings={drawings.map((d) => ({
              id: d.id,
              prompt: d.prompt,
              content: d.content,
              fills: d.fills ?? {},
              strokes: parseStrokes(d.strokes),
              createdAt: d.created_at,
              badge: d.kid_id
                ? kidById.get(d.kid_id)?.avatar ?? undefined
                : undefined,
            }))}
          />
        )}
      </section>
    </main>
  );
}
