"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { demoStore } from "@/lib/demo-store";

const IDEAS = [
  "Un dinosauro felice",
  "Un gattino con un palloncino",
  "Un razzo tra le stelle",
  "Una principessa e un drago gentile",
  "Un trattore in fattoria",
];

export function PromptForm({
  remaining,
  kidId = null,
}: {
  remaining: number;
  /** Bambino attivo: il disegno creato viene associato a lui. */
  kidId?: string | null;
}) {
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
        body: JSON.stringify({ prompt, kidId }),
      });
      // La risposta può non essere JSON (es. timeout/crash della funzione
      // su Vercel): niente .json() cieco, altrimenti Safari mostra il
      // criptico "The string did not match the expected pattern".
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(
          data?.error ??
            `Il server non ha risposto correttamente (errore ${res.status}), riprova.`
        );
      }
      if (!data) {
        throw new Error("Risposta non valida dal server, riprova.");
      }
      if (data.demo) {
        // Modalità PoC: il disegno viene salvato sul dispositivo.
        const drawing = demoStore.add({
          prompt,
          kind: data.kind,
          content: data.content,
        });
        router.push(`/color/${drawing.id}`);
        return;
      }
      // Il bambino viaggia nell'URL: tornando alla home la sua selezione
      // è ancora attiva.
      router.push(
        kidId
          ? `/color/${data.id}?kid=${encodeURIComponent(kidId)}`
          : `/color/${data.id}`
      );
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

      {loading && <DrawingLoader />}
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

const LOADER_STEPS = [
  "Prendo le matite... ✏️",
  "Traccio le linee... 〰️",
  "Aggiungo i dettagli... ✨",
  "Ci siamo quasi! 🎨",
];

// Attesa giocosa: matite che rimbalzano e messaggi che si alternano,
// così i secondi passano meno lentamente per un bambino.
function DrawingLoader() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const id = setInterval(
      () => setStep((s) => Math.min(s + 1, LOADER_STEPS.length - 1)),
      2200
    );
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className="mt-4 flex flex-col items-center gap-3 rounded-3xl bg-crayon-yellow/20 p-6"
      aria-live="polite"
    >
      <div className="flex gap-2 text-3xl">
        {["🖍️", "✏️", "🖌️"].map((emoji, i) => (
          <span
            key={emoji}
            className="crayon-bounce"
            style={{ animationDelay: `${i * 160}ms` }}
          >
            {emoji}
          </span>
        ))}
      </div>
      <p className="text-sm font-extrabold text-crayon-purple">
        {LOADER_STEPS[step]}
      </p>
    </div>
  );
}
