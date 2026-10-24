"use client";

import { useState } from "react";

export function PasswordForm() {
  const [current, setCurrent] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [state, setState] = useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      return setError("Minimo 8 caratteri.");
    }
    if (password !== confirm) {
      return setError("Le due password non coincidono.");
    }
    setState("saving");
    const res = await fetch("/api/account/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ current, password }),
    }).catch(() => null);
    if (!res?.ok) {
      const body = await res?.json().catch(() => null);
      setState("idle");
      setError(body?.error ?? "Cambio non riuscito, riprova.");
      return;
    }
    setCurrent("");
    setPassword("");
    setConfirm("");
    setState("saved");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        type="password"
        value={current}
        onChange={(e) => setCurrent(e.target.value)}
        placeholder="Password attuale"
        autoComplete="current-password"
        className="ink-field !py-2.5"
      />
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Nuova password"
          autoComplete="new-password"
          className="ink-field flex-1 !py-2.5"
        />
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Ripeti la password"
          autoComplete="new-password"
          className="ink-field flex-1 !py-2.5"
        />
        <button
          type="submit"
          disabled={state === "saving" || !password || !current}
          className="ink-btn ink-btn-dark px-5 py-2.5"
        >
          {state === "saving" ? "..." : "Cambia"}
        </button>
      </div>
      {state === "saved" && (
        <p className="text-sm font-bold text-mint">
          ✓ Password aggiornata
        </p>
      )}
      {error && <p className="text-sm font-bold text-tomato">{error}</p>}
    </form>
  );
}
