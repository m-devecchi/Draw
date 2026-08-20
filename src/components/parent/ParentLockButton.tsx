"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

// Richiude l'area genitori e riporta il bambino ai disegni.
export function ParentLockButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    await fetch("/api/parent/verify", { method: "DELETE" }).catch(() => {});
    router.push("/");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="rounded-full bg-crayon-purple px-5 py-2 font-bold text-white shadow transition active:scale-95 disabled:opacity-50"
    >
      🔒 Chiudi area genitori
    </button>
  );
}
