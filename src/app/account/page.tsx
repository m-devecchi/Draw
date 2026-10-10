import { Emoji } from "@/components/ui/Emoji";
import { Icon } from "@/components/ui/Icon";
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
          className="ink-icon-btn"
        >
          <Icon name="home" />
        </Link>
        <h1 className="font-display text-3xl font-semibold">
          Il tuo account
        </h1>
      </header>

      {/* Profilo */}
      <section className="ink-card p-6">
        <h2 className="mb-1 font-display text-2xl font-semibold">Profilo</h2>
        <p className="mb-4 text-sm font-semibold text-ink-soft">
          {user.email}
          {memberSince && ` · con noi dal ${memberSince}`}
        </p>
        <ProfileNameForm initialName={profile?.display_name ?? ""} />
      </section>

      {/* Piano e utilizzo */}
      <section className="ink-card mt-6 p-6">
        <h2 className="mb-4 font-display text-2xl font-semibold">Piano e utilizzo</h2>
        <div className="mb-4 grid grid-cols-3 gap-3 text-center">
          <div className="rounded-2xl border border-line-strong bg-canvas p-3">
            <p className="font-display text-3xl font-semibold">
              <Emoji char={quota.plan === "premium" ? "⭐" : "🖍️"} size={36} decorative />
            </p>
            <p className="text-xs font-extrabold text-ink-soft">
              {quota.plan === "premium" ? "Premium" : "Free"}
            </p>
          </div>
          <div className="rounded-2xl border border-line-strong bg-canvas p-3">
            <p className="font-display text-3xl font-semibold">
              {quota.usedToday}/{quota.limit}
            </p>
            <p className="text-xs font-extrabold text-ink-soft">oggi</p>
          </div>
          <div className="rounded-2xl border border-line-strong bg-canvas p-3">
            <p className="font-display text-3xl font-semibold">
              {drawingsCount ?? 0}
            </p>
            <p className="text-xs font-extrabold text-ink-soft">disegni totali</p>
          </div>
        </div>
        {quota.plan === "free" ? (
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm font-semibold text-ink-soft">
              Col piano Premium crei fino a {`50`} disegni al giorno.
            </p>
            <UpgradeButton />
          </div>
        ) : (
          <p className="text-sm font-semibold text-ink-soft">
            Sei Premium, grazie! La gestione dell&apos;abbonamento arriverà
            qui.
          </p>
        )}
      </section>

      {/* Bambini */}
      <section className="ink-card mt-6 p-6">
        <h2 className="mb-1 font-display text-2xl font-semibold">I tuoi bambini</h2>
        <p className="mb-4 text-sm font-semibold text-ink-soft">
          Crea un profilo per ogni bimbo: nella home scegli chi sta disegnando
          e ognuno ritrova i propri disegni.
        </p>
        <KidProfiles initialKids={kids ?? []} />
      </section>

      {/* Cancello parentale */}
      <section className="ink-card mt-6 p-6">
        <h2 className="mb-1 font-display text-2xl font-semibold">PIN genitore</h2>
        <p className="mb-4 text-sm font-semibold text-ink-soft">
          {parentProfile?.parent_pin_hash
            ? "Questa area è protetta dal tuo PIN. Puoi cambiarlo qui."
            : "Senza PIN l'area genitori è protetta solo da una domanda di matematica. Imposta un PIN: è più sicuro."}
        </p>
        <ParentPinForm hasPin={Boolean(parentProfile?.parent_pin_hash)} />
      </section>

      {/* Sicurezza */}
      <section className="ink-card mt-6 p-6">
        <h2 className="mb-4 font-display text-2xl font-semibold">Cambia email</h2>
        <EmailForm currentEmail={user.email ?? ""} />
      </section>

      <section className="ink-card mt-6 p-6">
        <h2 className="mb-4 font-display text-2xl font-semibold">Cambia password</h2>
        <PasswordForm />
      </section>

      {/* Esci + zona pericolosa */}
      <section className="ink-card mt-6 flex flex-wrap items-center justify-between gap-3 p-6">
        <ParentLockButton />
        <form action="/auth/signout" method="post">
          <button
            type="submit"
            className="ink-btn px-5 py-2.5"
          >
            <Icon name="logout" className="!h-5 !w-5" />
            Esci
          </button>
        </form>
        <DeleteAccountButton />
      </section>
    </main>
  );
}
