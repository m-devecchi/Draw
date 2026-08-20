"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Doppia conferma: per eliminare bisogna scrivere ELIMINA.
// (È anche un piccolo "cancello parentale": un bambino non lo fa per sbaglio.)
export function DeleteAccountButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/account/delete", { method: "POST" });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error ?? "Eliminazione non riuscita");
      }
      router.push("/login");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore, riprova");
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full border-2 border-red-200 px-5 py-2 font-bold text-red-500 transition hover:bg-red-50 active:scale-95"
      >
        Elimina account
      </button>
    );
  }

  return (
    <div className="space-y-3 rounded-2xl border-2 border-red-200 bg-red-50 p-4">
      <p className="text-sm font-semibold text-red-600">
        Verranno cancellati per sempre account, disegni e abbonamento. Per
        confermare scrivi <span className="font-extrabold">ELIMINA</span>:
      </p>
      <div className="flex flex-wrap gap-2">
        <input
          type="text"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          className="flex-1 rounded-2xl border-2 border-red-200 px-4 py-2 outline-none focus:border-red-400"
          placeholder="ELIMINA"
        />
        <button
          type="button"
          disabled={confirmText.trim().toUpperCase() !== "ELIMINA" || loading}
          onClick={handleDelete}
          className="rounded-full bg-red-500 px-5 py-2 font-extrabold text-white shadow transition active:scale-95 disabled:opacity-40"
        >
          {loading ? "..." : "Elimina per sempre"}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setConfirmText("");
            setError(null);
          }}
          className="rounded-full bg-white px-5 py-2 font-bold text-stone-500 shadow transition active:scale-95"
        >
          Annulla
        </button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
