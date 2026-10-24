"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

// Recupero password: l'email contiene un codice a cifre. Qui lo si inserisce
// insieme alla nuova password.
function ResetForm() {
  const router = useRouter();
  const [email, setEmail] = useState(useSearchParams().get("email") ?? "");
  const [code, setCode] = useState("");
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
    const res = await fetch("/api/auth/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code, password }),
    }).catch(() => null);
    if (!res?.ok) {
      const data = await res?.json().catch(() => null);
      setLoading(false);
      return setError(
        data?.error ??
          "Non è stato possibile aggiornare la password. Controlla il codice o richiedine uno nuovo."
      );
    }
    // Password cambiata: si entra con le nuove credenziali.
    const login = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    }).catch(() => null);
    router.push(login?.ok ? "/" : "/login");
    router.refresh();
  }

  return (
    <main className="flex min-h-dvh items-center justify-center p-6">
      <div className="ink-card w-full max-w-sm p-7 sm:p-8">
        <div className="mb-6 text-center">
          <div className="mb-2 text-5xl">🔑</div>
          <h1 className="font-display text-3xl font-semibold">
            Scegli la nuova password
          </h1>
          <p className="mt-2 text-sm font-semibold text-ink-soft">
            Ti abbiamo mandato un codice per email (controlla anche lo spam).
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            required
            autoComplete="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="ink-field"
          />
          <input
            type="text"
            required
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="Codice ricevuto per email"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="ink-field"
          />
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
            <p
              role="alert"
              className="rounded-2xl border border-line-strong bg-tomato-50 p-3 text-sm font-bold"
            >
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

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetForm />
    </Suspense>
  );
}
