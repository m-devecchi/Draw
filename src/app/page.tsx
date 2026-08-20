import Link from "next/link";
import { redirect } from "next/navigation";
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

  const [quota, { data: drawings }] = await Promise.all([
    getQuotaStatus(user.id),
    supabase
      .from("drawings")
      .select("id, prompt, kind, created_at")
      .order("created_at", { ascending: false })
      .limit(30),
  ]);

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
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="text-sm font-semibold text-stone-400 hover:text-stone-600"
            >
              Esci
            </button>
          </form>
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

      <section className="mt-8">
        <h2 className="mb-3 text-xl font-extrabold">I tuoi disegni</h2>
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
                  <div className="mb-2 text-4xl">🎨</div>
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
