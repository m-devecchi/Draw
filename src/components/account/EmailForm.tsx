"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function EmailForm({ currentEmail }: { currentEmail: string }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "saving" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const newEmail = email.trim();
    if (!newEmail || newEmail === currentEmail) {
      return setError("Scrivi la nuova email (diversa da quella attuale).");
    }
    setState("saving");
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser(
      { email: newEmail },
      { emailRedirectTo: `${window.location.origin}/auth/callback?next=/account` }
    );
    if (error) {
      setState("idle");
      setError("Cambio non riuscito: controlla l'indirizzo e riprova.");
      return;
    }
    setState("sent");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
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
          className="flex-1 rounded-2xl border-2 border-stone-200 px-4 py-2 outline-none focus:border-crayon-blue"
        />
        <button
          type="submit"
          disabled={state === "saving" || !email.trim()}
          className="rounded-full bg-crayon-blue px-5 py-2 font-extrabold text-white shadow transition active:scale-95 disabled:opacity-50"
        >
          {state === "saving" ? "..." : "Cambia"}
        </button>
      </div>
      {state === "sent" && (
        <p className="text-sm font-semibold text-crayon-green">
          ✓ Ti abbiamo mandato un link di conferma su entrambe le caselle (la
          vecchia e la nuova): il cambio si completa dopo la conferma.
        </p>
      )}
      {error && <p className="text-sm text-red-500">{error}</p>}
    </form>
  );
}
