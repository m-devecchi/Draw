"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Pagina di destinazione del link "password dimenticata": il link email
// crea la sessione (via /auth/callback) e qui si sceglie la nuova password.
export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) return setError("Minimo 8 caratteri.");
    if (password !== confirm)
      return setError("Le due password non coincidono.");
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setLoading(false);
      setError(
        "Non è stato possibile aggiornare la password. Riapri il link dall'email (scade dopo un po') o richiedine uno nuovo."
      );
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <main className="flex min-h-dvh items-center justify-center p-6">
      <div className="ink-card w-full max-w-sm p-7 sm:p-8">
        <div className="mb-6 text-center">
          <div className="mb-2 text-5xl">🔑</div>
          <h1 className="font-display text-3xl font-extrabold">
            Scegli la nuova password
          </h1>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            placeholder="Nuova password (min 8 caratteri)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="ink-field"
          />
          <input
            type="password"
            required
            autoComplete="new-password"
            placeholder="Ripeti la password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="ink-field"
          />
          {error && (
            <p className="rounded-2xl border-2 border-ink bg-tomato-50 p-3 text-sm font-bold">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="ink-btn ink-btn-primary w-full py-3.5 text-lg"
          >
            {loading ? "Un attimo..." : "Salva e entra"}
          </button>
        </form>
      </div>
    </main>
  );
}
