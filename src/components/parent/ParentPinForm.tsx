"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ParentPinForm({ hasPin }: { hasPin: boolean }) {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!/^\d{4,8}$/.test(pin)) {
      return setError("Il PIN deve avere da 4 a 8 cifre.");
    }
    if (pin !== confirm) {
      return setError("I due PIN non coincidono.");
    }
    setLoading(true);
    try {
      const res = await fetch("/api/parent/pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "Salvataggio non riuscito");
      setPin("");
      setConfirm("");
      setDone(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore, riprova");
    } finally {
      setLoading(false);
    }
  }

  const field =
    "flex-1 rounded-2xl border-2 border-stone-200 px-4 py-2 tracking-widest outline-none focus:border-crayon-blue";

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="password"
          inputMode="numeric"
          value={pin}
          onChange={(e) => {
            setPin(e.target.value);
            setDone(false);
          }}
          placeholder={hasPin ? "Nuovo PIN" : "PIN (4-8 cifre)"}
          autoComplete="new-password"
          className={field}
        />
        <input
          type="password"
          inputMode="numeric"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Ripeti il PIN"
          autoComplete="new-password"
          className={field}
        />
        <button
          type="submit"
          disabled={loading || !pin}
          className="ink-btn ink-btn-dark px-5 py-2.5"
        >
          {loading ? "..." : hasPin ? "Cambia" : "Imposta"}
        </button>
      </div>
      {done && (
        <p className="text-sm font-bold text-mint">
          ✓ PIN salvato — da ora serve per entrare qui.
        </p>
      )}
      {error && <p className="text-sm font-bold text-tomato">{error}</p>}
    </form>
  );
}
