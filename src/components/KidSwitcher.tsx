"use client";

import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import { Emoji } from "@/components/ui/Emoji";
import type { KidProfile } from "@/components/account/KidProfiles";

// Selettore "chi sta disegnando?".
// Il bambino attivo vive nell'URL (?kid=<id>): è la sorgente di verità
// letta dal server, funziona col tasto Indietro ed è condivisibile —
// niente cookie da propagare tra middleware, CDN e refresh.
export function KidSwitcher({
  kids,
  activeKidId,
}: {
  kids: KidProfile[];
  activeKidId: string | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  function select(id: string | null) {
    startTransition(() => {
      router.push(id ? `${pathname}?kid=${encodeURIComponent(id)}` : pathname, {
        scroll: false,
      });
    });
  }

  const chip = () =>
    "ink-tile flex items-center gap-1.5 rounded-full bg-paper py-1.5 pl-2 pr-4 font-display font-bold";

  return (
    <div
      className={`flex flex-wrap items-center gap-2 ${pending ? "opacity-60" : ""}`}
    >
      <span className="mr-1 text-sm font-extrabold">Chi disegna?</span>
      <button
        type="button"
        onClick={() => select(null)}
        aria-pressed={activeKidId === null}
        className={chip()}
      >
        <Emoji char="👨‍👩‍👧" size={28} decorative />
        Tutti
      </button>
      {kids.map((kid) => (
        <button
          key={kid.id}
          type="button"
          onClick={() => select(kid.id)}
          aria-pressed={activeKidId === kid.id}
          className={chip()}
        >
          <Emoji char={kid.avatar} size={28} decorative />
          {kid.name}
        </button>
      ))}
    </div>
  );
}
