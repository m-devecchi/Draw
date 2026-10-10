import Link from "next/link";
import { redirect } from "next/navigation";
import { DrawingGallery } from "@/components/DrawingGallery";
import { QuotaCrayons } from "@/components/QuotaCrayons";
import { KidSwitcher } from "@/components/KidSwitcher";
import { PromptForm } from "@/components/PromptForm";
import { UpgradeButton } from "@/components/UpgradeButton";
import { DemoHome } from "@/components/demo/DemoHome";
import { EmptyGallery } from "@/components/fun/EmptyGallery";
import { Footer } from "@/components/fun/Footer";
import { HomeHero, Scribble, SectionTitle } from "@/components/fun/HomeHero";
import { Logo } from "@/components/fun/Logo";
import { Emoji } from "@/components/ui/Emoji";
import { Icon } from "@/components/ui/Icon";
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

  const activeKid = activeKidId ? kidById.get(activeKidId) : undefined;

  return (
    <main className="mx-auto max-w-5xl px-4 pb-10 pt-5 sm:px-6 sm:pt-8">
      <header className="mb-6 flex items-center justify-between gap-3">
        <Logo />
        <div className="flex items-center gap-2.5">
          {quota.plan === "premium" && (
            <span className="ink-chip bg-sun-50">
              <Icon name="star" className="!h-4 !w-4" />
              Premium
            </span>
          )}
          {/* Area genitori: protetta dal cancello parentale */}
          <Link
            href="/parent-gate?next=/account"
            aria-label="Area genitori"
            className="ink-icon-btn"
          >
            <Icon name="lock" />
          </Link>
        </div>
      </header>

      <HomeHero
        title={
          activeKid ? (
            <>
              <Emoji
                char={activeKid.avatar}
                size={44}
                decorative
                className="-mt-2 mr-1 align-middle"
              />
              Cosa <Scribble>coloriamo</Scribble>, {activeKid.name}?
            </>
          ) : (
            <>
              Cosa <Scribble>coloriamo</Scribble> oggi?
            </>
          )
        }
      >
        <PromptForm remaining={quota.remaining} kidId={activeKidId} />
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <QuotaCrayons used={quota.usedToday} limit={quota.limit} />
          {quota.plan === "free" && quota.remaining === 0 && <UpgradeButton />}
        </div>
      </HomeHero>

      {(kids?.length ?? 0) > 0 && (
        <div className="mt-8">
          <KidSwitcher kids={kids ?? []} activeKidId={activeKidId} />
        </div>
      )}

      <section className="mt-10">
        <SectionTitle
          title={
            activeKid ? `I disegni di ${activeKid.name}` : "I tuoi disegni"
          }
        />
        {!drawings?.length ? (
          <EmptyGallery>
            {activeKid ? (
              <>
                <p className="font-bold">
                  {activeKid.name} non ha ancora disegni suoi.
                </p>
                <p className="mt-1 text-sm">
                  Creane uno qui sopra, oppure{" "}
                  <Link href="/" className="font-bold underline">
                    guarda tutti i disegni
                  </Link>
                  .
                </p>
              </>
            ) : undefined}
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
      <Footer />
    </main>
  );
}
