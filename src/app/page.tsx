import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { KidSwitcher, KID_COOKIE } from "@/components/KidSwitcher";
import { PromptForm } from "@/components/PromptForm";
import { UpgradeButton } from "@/components/UpgradeButton";
import { DemoHome } from "@/components/demo/DemoHome";
import { isDemoMode } from "@/lib/config";
import { getQuotaStatus } from "@/lib/quota";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  if (isDemoMode()) return <DemoHome />;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Bambino attivo (cookie): filtra la galleria e tagga i nuovi disegni.
  // Se la migrazione 0002 non è ancora applicata, kids è null e la
  // funzionalità resta semplicemente spenta.
  const { data: kids } = await supabase
    .from("kid_profiles")
    .select("id, name, avatar")
    .order("created_at");
  const kidsEnabled = Array.isArray(kids);
  const cookieStore = await cookies();
  const cookieKid = cookieStore.get(KID_COOKIE)?.value ?? null;
  const activeKidId =
    kids?.some((k) => k.id === cookieKid) === true ? cookieKid : null;

  interface DrawingRow {
    id: string;
    prompt: string;
    kind: string;
    created_at: string;
    kid_id?: string | null;
  }

  let drawingsQuery = supabase
    .from("drawings")
    .select(
      kidsEnabled
        ? "id, prompt, kind, created_at, kid_id"
        : ("id, prompt, kind, created_at" as string)
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
          <Link
            href="/account"
            aria-label="Il tuo account"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-lg shadow transition active:scale-90"
          >
            👤
          </Link>
        </div>
      </header>

      <section className="rounded-3xl bg-white p-6 shadow-xl">
        <h2 className="mb-1 text-xl font-extrabold">
          Cosa vuoi colorare oggi?
        </h2>
        <p className="mb-4 text-sm text-stone-500">
          Scrivi un&apos;idea e creiamo il disegno: poi tocca le aree per
          riempirle di colore!
        </p>
        <PromptForm remaining={quota.remaining} />
        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
          <span className="font-semibold text-stone-500">
            Oggi: {quota.usedToday}/{quota.limit} disegni
          </span>
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
          <p className="rounded-3xl bg-white/60 p-8 text-center text-stone-400">
            Ancora nessun disegno: creane uno qui sopra! 🎨
          </p>
        ) : (
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {drawings.map((d) => (
              <li key={d.id}>
                <Link
                  href={`/color/${d.id}`}
                  className="block rounded-3xl bg-white p-4 shadow transition hover:shadow-lg active:scale-95"
                >
                  <div className="mb-2 text-4xl">
                    {(d.kid_id && kidById.get(d.kid_id)?.avatar) || "🎨"}
                  </div>
                  <p className="line-clamp-2 font-bold">{d.prompt}</p>
                  <p className="mt-1 text-xs text-stone-400">
                    {new Date(d.created_at).toLocaleDateString("it-IT")}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
