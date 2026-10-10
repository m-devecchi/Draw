"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { demoStore } from "@/lib/demo-store";
import { AgeSelect } from "./AgeSelect";
import { IdeaButtons } from "./IdeaButtons";
import { Icon } from "@/components/ui/Icon";
import { type AgeBand } from "@/lib/age-bands";


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
  // L'età si sceglie a ogni disegno. L'ultima scelta resta preselezionata
  // (su un telefono di famiglia spesso è lo stesso bimbo), ma è sempre
  // in vista e basta un tocco per cambiarla.
  const [ageBand, setAgeBand] = useState<AgeBand>("medium");

  useEffect(() => {
    const saved = window.localStorage.getItem("colora-last-age");
    if (saved === "small" || saved === "medium" || saved === "big") {
      setAgeBand(saved);
    }
  }, []);

  function pickAge(band: AgeBand) {
    setAgeBand(band);
    try {
      window.localStorage.setItem("colora-last-age", band);
    } catch {
      // localStorage non disponibile: vale per questa sessione
    }
  }
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
        body: JSON.stringify({ prompt, kidId, ageBand }),
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
          ageBand,
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {!loading && (
        <AgeSelect value={ageBand} onChange={pickAge} disabled={loading} />
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <label htmlFor="prompt" className="sr-only">
          Cosa vuoi disegnare?
        </label>
        <input
          id="prompt"
          type="text"
          required
          minLength={2}
          maxLength={300}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Es. un elefantino che fa il bagno"
          disabled={loading}
          className="ink-field flex-1 text-lg"
        />
        <button
          type="submit"
          disabled={loading || remaining <= 0}
          className="ink-btn ink-btn-primary px-7 py-3.5 text-xl"
        >
          <Icon name="sparkles" />
          {loading ? "Sto disegnando..." : "Crea!"}
        </button>
      </div>

      {loading && <DrawingLoader />}
      {error && (
        <p
          role="alert"
          className="rounded-2xl border-2 border-ink bg-tomato-50 p-3 text-sm font-bold"
        >
          {error}
        </p>
      )}

      {!loading && (
        <div>
          <p className="mb-2 text-sm font-extrabold text-ink">
            Oppure scegli un&apos;idea
          </p>
          <IdeaButtons selected={prompt} onPick={setPrompt} disabled={loading} />
        </div>
      )}
    </form>
  );
}

const LOADER_STEPS = [
  "Prendo i pastelli",
  "Traccio le linee",
  "Aggiungo i dettagli",
  "Ci siamo quasi!",
];

// Attesa giocosa: una stella che si disegna da sola, una barra che avanza
// e messaggi che si alternano, così i secondi passano meno lentamente.
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
      className="flex items-center gap-4 rounded-2xl border-[2.5px] border-ink bg-paper p-4"
      aria-live="polite"
    >
      <svg viewBox="0 0 64 64" className="h-16 w-16 shrink-0" aria-hidden="true">
        <path
          className="draw-path"
          pathLength={1}
          d="M32 6l7.6 16.2 17.6 2.1-13 12.1 3.4 17.4L32 45.1 16.4 53.8l3.4-17.4-13-12.1 17.6-2.1z"
          fill="none"
          stroke="#1d1638"
          strokeWidth="4"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
      <div className="min-w-0 flex-1">
        <p className="font-display text-lg font-bold leading-tight">
          {LOADER_STEPS[step]}
        </p>
        <div className="mt-2 h-4 overflow-hidden rounded-full border-2 border-ink bg-canvas">
          <div
            className="progress-stripes h-full rounded-full"
            style={{ width: `${25 + step * 23}%` }}
          />
        </div>
      </div>
    </div>
  );
}
