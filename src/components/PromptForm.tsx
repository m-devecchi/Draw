"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const IDEAS = [
  "Un dinosauro felice",
  "Un gattino con un palloncino",
  "Un razzo tra le stelle",
  "Una principessa e un drago gentile",
  "Un trattore in fattoria",
];

export function PromptForm({ remaining }: { remaining: number }) {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Generazione non riuscita, riprova.");
      }
      router.push(`/color/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore, riprova.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          required
          minLength={2}
          maxLength={300}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Es. un elefantino che fa il bagno"
          disabled={loading}
          className="flex-1 rounded-2xl border-2 border-stone-200 px-4 py-3 text-lg outline-none focus:border-crayon-blue disabled:bg-stone-50"
        />
        <button
          type="submit"
          disabled={loading || remaining <= 0}
          className="rounded-2xl bg-crayon-green px-6 py-3 text-lg font-extrabold text-white shadow-lg transition active:scale-95 disabled:opacity-40"
        >
          {loading ? "Sto disegnando... ✏️" : "Crea!"}
        </button>
      </div>

      {loading && (
        <p className="mt-3 animate-pulse text-sm font-semibold text-crayon-blue">
          Il disegno sta arrivando, può volerci un minutino... 🎨
        </p>
      )}
      {error && (
        <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        {IDEAS.map((idea) => (
          <button
            key={idea}
            type="button"
            disabled={loading}
            onClick={() => setPrompt(idea)}
            className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-500 transition hover:bg-crayon-yellow/40"
          >
            {idea}
          </button>
        ))}
      </div>
    </form>
  );
}
