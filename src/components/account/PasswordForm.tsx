"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function PasswordForm() {
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
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setState("idle");
      setError("Cambio non riuscito: prova a uscire e rientrare, poi riprova.");
      return;
    }
    setPassword("");
    setConfirm("");
    setState("saved");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Nuova password"
          autoComplete="new-password"
          className="flex-1 rounded-2xl border-2 border-stone-200 px-4 py-2 outline-none focus:border-crayon-blue"
        />
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Ripeti la password"
          autoComplete="new-password"
          className="flex-1 rounded-2xl border-2 border-stone-200 px-4 py-2 outline-none focus:border-crayon-blue"
        />
        <button
          type="submit"
          disabled={state === "saving" || !password}
          className="rounded-full bg-crayon-blue px-5 py-2 font-extrabold text-white shadow transition active:scale-95 disabled:opacity-50"
        >
          {state === "saving" ? "..." : "Cambia"}
        </button>
      </div>
      {state === "saved" && (
        <p className="text-sm font-semibold text-crayon-green">
          ✓ Password aggiornata
        </p>
      )}
      {error && <p className="text-sm text-red-500">{error}</p>}
    </form>
  );
}
