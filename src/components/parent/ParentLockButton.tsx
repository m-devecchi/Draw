"use client";

import { Icon } from "@/components/ui/Icon";
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
      className="ink-btn ink-btn-dark px-5 py-2.5"
    >
      <Icon name="lock" className="!h-5 !w-5" />
      Chiudi area genitori
    </button>
  );
}
