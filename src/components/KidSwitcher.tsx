"use client";

import { useRouter } from "next/navigation";
import type { KidProfile } from "@/components/account/KidProfiles";

export const KID_COOKIE = "colora_kid";

// Selettore "chi sta disegnando?": scrive il bambino attivo in un cookie,
// letto dal server per filtrare la galleria e associare i nuovi disegni.
export function KidSwitcher({
  kids,
  activeKidId,
}: {
  kids: KidProfile[];
  activeKidId: string | null;
}) {
  const router = useRouter();

  function select(id: string | null) {
    if (id) {
      document.cookie = `${KID_COOKIE}=${id}; path=/; max-age=31536000; samesite=lax`;
    } else {
      document.cookie = `${KID_COOKIE}=; path=/; max-age=0`;
    }
    router.refresh();
  }

  const chip = (active: boolean) =>
    `flex items-center gap-1.5 rounded-full px-4 py-2 font-bold transition active:scale-95 ${
      active ? "bg-crayon-yellow shadow" : "bg-white text-stone-500 shadow-sm"
    }`;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm font-semibold text-stone-500">
        Chi disegna?
      </span>
      <button
        type="button"
        onClick={() => select(null)}
        className={chip(activeKidId === null)}
      >
        👨‍👩‍👧 Tutti
      </button>
      {kids.map((kid) => (
        <button
          key={kid.id}
          type="button"
          onClick={() => select(kid.id)}
          className={chip(activeKidId === kid.id)}
        >
          <span className="text-lg">{kid.avatar}</span>
          {kid.name}
        </button>
      ))}
    </div>
  );
}
