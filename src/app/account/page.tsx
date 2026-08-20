import Link from "next/link";
import { redirect } from "next/navigation";
import { DeleteAccountButton } from "@/components/account/DeleteAccountButton";
import { EmailForm } from "@/components/account/EmailForm";
import { KidProfiles } from "@/components/account/KidProfiles";
import { PasswordForm } from "@/components/account/PasswordForm";
import { ProfileNameForm } from "@/components/account/ProfileNameForm";
import { UpgradeButton } from "@/components/UpgradeButton";
import { ParentLockButton } from "@/components/parent/ParentLockButton";
import { ParentPinForm } from "@/components/parent/ParentPinForm";
import { isDemoMode } from "@/lib/config";
import { isParentUnlocked } from "@/lib/parent-gate";
import { createAdminClient } from "@/lib/supabase/admin";
import { getQuotaStatus } from "@/lib/quota";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  if (isDemoMode()) redirect("/");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Cancello parentale: l'area impostazioni non è per i bambini.
  if (!(await isParentUnlocked(user.id))) {
    redirect("/parent-gate?next=/account");
  }

  const { data: parentProfile } = await createAdminClient()
    .from("profiles")
    .select("parent_pin_hash")
    .eq("id", user.id)
    .single();

  const [quota, { data: profile }, { count: drawingsCount }, { data: kids }] =
    await Promise.all([
      getQuotaStatus(user.id),
      supabase
        .from("profiles")
        .select("display_name, created_at")
        .eq("id", user.id)
        .single(),
      supabase
        .from("drawings")
        .select("id", { count: "exact", head: true }),
      supabase
        .from("kid_profiles")
        .select("id, name, avatar")
        .order("created_at"),
    ]);

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("it-IT", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <main className="mx-auto max-w-2xl p-4 pb-16 sm:p-6">
      <header className="mb-6 flex items-center gap-3">
        <Link
          href="/"
          aria-label="Torna ai disegni"
          className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-xl shadow transition active:scale-90"
        >
          🏠
        </Link>
        <h1 className="text-3xl font-extrabold text-crayon-purple">
          Il tuo account
        </h1>
      </header>

      {/* Profilo */}
      <section className="rounded-3xl bg-white p-6 shadow-xl">
        <h2 className="mb-1 text-xl font-extrabold">Profilo</h2>
        <p className="mb-4 text-sm text-stone-500">
          {user.email}
          {memberSince && ` · con noi dal ${memberSince}`}
        </p>
        <ProfileNameForm initialName={profile?.display_name ?? ""} />
      </section>

      {/* Piano e utilizzo */}
      <section className="mt-6 rounded-3xl bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-xl font-extrabold">Piano e utilizzo</h2>
        <div className="mb-4 grid grid-cols-3 gap-3 text-center">
          <div className="rounded-2xl bg-stone-50 p-3">
            <p className="text-2xl font-extrabold text-crayon-purple">
              {quota.plan === "premium" ? "⭐" : "🖍️"}
            </p>
            <p className="text-xs font-bold text-stone-500">
              {quota.plan === "premium" ? "Premium" : "Free"}
            </p>
          </div>
          <div className="rounded-2xl bg-stone-50 p-3">
            <p className="text-2xl font-extrabold text-crayon-blue">
              {quota.usedToday}/{quota.limit}
            </p>
            <p className="text-xs font-bold text-stone-500">oggi</p>
          </div>
          <div className="rounded-2xl bg-stone-50 p-3">
            <p className="text-2xl font-extrabold text-crayon-green">
              {drawingsCount ?? 0}
            </p>
            <p className="text-xs font-bold text-stone-500">disegni totali</p>
          </div>
        </div>
        {quota.plan === "free" ? (
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm text-stone-500">
              Col piano Premium crei fino a {`50`} disegni al giorno.
            </p>
            <UpgradeButton />
          </div>
        ) : (
          <p className="text-sm text-stone-500">
            Sei Premium ⭐ — grazie! La gestione dell&apos;abbonamento arriverà
            qui.
          </p>
        )}
      </section>

      {/* Bambini */}
      <section className="mt-6 rounded-3xl bg-white p-6 shadow-xl">
        <h2 className="mb-1 text-xl font-extrabold">I tuoi bambini</h2>
        <p className="mb-4 text-sm text-stone-500">
          Crea un profilo per ogni bimbo: nella home scegli chi sta disegnando
          e ognuno ritrova i propri disegni.
        </p>
        <KidProfiles initialKids={kids ?? []} />
      </section>

      {/* Cancello parentale */}
      <section className="mt-6 rounded-3xl bg-white p-6 shadow-xl">
        <h2 className="mb-1 text-xl font-extrabold">🔒 PIN genitore</h2>
        <p className="mb-4 text-sm text-stone-500">
          {parentProfile?.parent_pin_hash
            ? "Questa area è protetta dal tuo PIN. Puoi cambiarlo qui."
            : "Senza PIN l'area genitori è protetta solo da una domanda di matematica. Imposta un PIN: è più sicuro."}
        </p>
        <ParentPinForm hasPin={Boolean(parentProfile?.parent_pin_hash)} />
      </section>

      {/* Sicurezza */}
      <section className="mt-6 rounded-3xl bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-xl font-extrabold">Cambia email</h2>
        <EmailForm currentEmail={user.email ?? ""} />
      </section>

      <section className="mt-6 rounded-3xl bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-xl font-extrabold">Cambia password</h2>
        <PasswordForm />
      </section>

      {/* Esci + zona pericolosa */}
      <section className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-3xl bg-white p-6 shadow-xl">
        <ParentLockButton />
        <form action="/auth/signout" method="post">
          <button
            type="submit"
            className="rounded-full bg-stone-100 px-5 py-2 font-bold text-stone-600 shadow transition active:scale-95"
          >
            👋 Esci
          </button>
        </form>
        <DeleteAccountButton />
      </section>
    </main>
  );
}
