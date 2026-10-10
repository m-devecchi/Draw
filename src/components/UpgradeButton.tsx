"use client";

import { Icon } from "@/components/ui/Icon";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function UpgradeButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/billing/checkout", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
        return;
      }
      // Il pagamento passa dall'area genitori.
      if (data?.needsParent) {
        router.push("/parent-gate?next=/account");
        return;
      }
      setMessage(data.error ?? "I pagamenti non sono ancora attivi.");
    } catch {
      setMessage("Errore, riprova più tardi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <span className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="ink-btn ink-btn-dark px-4 py-2 text-sm"
      >
        <Icon name="star" className="!h-4 !w-4 text-sun" />
        Passa a Premium
      </button>
      {message && <span className="text-xs font-bold text-ink/70">{message}</span>}
    </span>
  );
}
