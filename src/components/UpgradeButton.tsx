"use client";

import { useState } from "react";

export function UpgradeButton() {
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
        className="rounded-full bg-crayon-yellow px-4 py-1.5 text-sm font-extrabold shadow transition active:scale-95 disabled:opacity-50"
      >
        ⭐ Passa a Premium
      </button>
      {message && <span className="text-xs text-stone-500">{message}</span>}
    </span>
  );
}
