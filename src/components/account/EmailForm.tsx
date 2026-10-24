"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

// Cambio email in due passi: il codice arriva al NUOVO indirizzo e si
// inserisce qui sotto; il cambio si completa alla conferma.
export function EmailForm({ currentEmail }: { currentEmail: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [state, setState] = useState<"idle" | "saving" | "sent" | "done">(
    "idle"
  );
  const [error, setError] = useState<string | null>(null);

  async function send(method: "POST" | "PUT", body: object) {
    const res = await fetch("/api/account/email", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).catch(() => null);
    if (res?.ok) return null;
    const data = await res?.json().catch(() => null);
    return (data?.error as string | undefined) ?? "Cambio non riuscito, riprova.";
  }

  async function handleRequest(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const newEmail = email.trim();
    if (!newEmail || newEmail === currentEmail) {
      return setError("Scrivi la nuova email (diversa da quella attuale).");
    }
    setState("saving");
    const err = await send("POST", { email: newEmail });
    if (err) {
      setState("idle");
      return setError(err);
    }
    setState("sent");
  }

  async function handleConfirm(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setState("saving");
    const err = await send("PUT", { code: code.trim() });
    if (err) {
      setState("sent");
      return setError(err);
    }
    setState("done");
    router.refresh();
  }

  if (state === "sent" || (state === "saving" && code)) {
    return (
      <form onSubmit={handleConfirm} className="space-y-3">
        <p className="text-sm font-bold text-ink-soft">
          Ti abbiamo scritto a {email.trim()}: inserisci il codice che trovi
          nell&apos;email.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Codice di conferma"
            className="ink-field flex-1 !py-2.5"
          />
          <button
            type="submit"
            disabled={state === "saving" || !code.trim()}
            className="ink-btn ink-btn-dark px-5 py-2.5"
          >
            {state === "saving" ? "..." : "Conferma"}
          </button>
        </div>
        {error && <p className="text-sm font-bold text-tomato">{error}</p>}
      </form>
    );
  }

  return (
    <form onSubmit={handleRequest} className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setState("idle");
          }}
          placeholder={`Nuova email (attuale: ${currentEmail})`}
          autoComplete="email"
          className="ink-field flex-1 !py-2.5"
        />
        <button
          type="submit"
          disabled={state === "saving" || !email.trim()}
          className="ink-btn ink-btn-dark px-5 py-2.5"
        >
          {state === "saving" ? "..." : "Cambia"}
        </button>
      </div>
      {state === "done" && (
        <p className="text-sm font-bold text-mint">✓ Email aggiornata</p>
      )}
      {error && <p className="text-sm font-bold text-tomato">{error}</p>}
    </form>
  );
}
