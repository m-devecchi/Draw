"use client";

import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
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

  const chip = (active: boolean) =>
    `flex items-center gap-1.5 rounded-full px-4 py-2 font-bold transition active:scale-95 ${
      active ? "bg-crayon-yellow shadow" : "bg-white text-stone-500 shadow-sm"
    }`;

  return (
    <div
      className={`flex flex-wrap items-center gap-2 ${pending ? "opacity-60" : ""}`}
    >
      <span className="text-sm font-semibold text-stone-500">Chi disegna?</span>
      <button
        type="button"
        onClick={() => select(null)}
        aria-pressed={activeKidId === null}
        className={chip(activeKidId === null)}
      >
        👨‍👩‍👧 Tutti
      </button>
      {kids.map((kid) => (
        <button
          key={kid.id}
          type="button"
          onClick={() => select(kid.id)}
          aria-pressed={activeKidId === kid.id}
          className={chip(activeKidId === kid.id)}
        >
          <span className="text-lg">{kid.avatar}</span>
          {kid.name}
        </button>
      ))}
    </div>
  );
}
