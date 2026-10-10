"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    const supabase = createClient();

    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.push(next);
        router.refresh();
      } else {
        // Il server crea l'account già confermato; poi si entra subito.
        const res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const result = await res.json().catch(() => null);
        if (!res.ok) {
          throw new Error(result?.error ?? "Registrazione non riuscita, riprova.");
        }

        if (result?.confirm) {
          // Conferma via email richiesta (REQUIRE_EMAIL_CONFIRMATION=true)
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: `${window.location.origin}/auth/callback`,
            },
          });
          if (error) throw error;
          if (!data.session) {
            setInfo("Controlla la tua email per confermare la registrazione.");
            return;
          }
        } else {
          const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (error) throw error;
        }
        router.push(next);
        router.refresh();
      }
    } catch (err) {
      setError(
        err instanceof Error && err.message === "Invalid login credentials"
          ? "Email o password non corretti."
          : err instanceof Error && err.message === "Email not confirmed"
            ? "Questo account non è ancora confermato: scrivici e lo sblocchiamo."
            : err instanceof Error
            ? err.message
            : "Qualcosa è andato storto, riprova."
      );
    } finally {
      setLoading(false);
    }
  }

  // Login con Google / Apple (i provider vanno abilitati su Supabase).
  async function handleOAuth(provider: "google" | "apple") {
    setError(null);
    setOauthLoading(provider);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    if (error) {
      setOauthLoading(null);
      setError(
        `Accesso con ${provider === "google" ? "Google" : "Apple"} non disponibile al momento.`
      );
    }
    // In caso di successo il browser viene reindirizzato al provider.
  }

  // Invia l'email di recupero password.
  async function handleForgotPassword() {
    setError(null);
    setInfo(null);
    if (!email) {
      setError("Scrivi prima la tua email qui sopra, poi ripremi il link.");
      return;
    }
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/account/reset-password`,
    });
    if (error) {
      setError("Invio non riuscito, riprova tra qualche minuto.");
    } else {
      setInfo(
        "Ti abbiamo mandato un'email: apri il link per scegliere una nuova password (controlla anche lo spam)."
      );
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-xl">
        <div className="mb-6 text-center">
          <div className="mb-2 text-5xl">🖍️</div>
          <h1 className="text-3xl font-extrabold text-crayon-purple">Colora</h1>
          <p className="mt-1 text-sm text-stone-500">
            Disegni da colorare per i più piccoli
          </p>
        </div>

        <div className="mb-6 grid grid-cols-2 rounded-full bg-stone-100 p-1 text-sm font-bold">
          <button
            type="button"
            onClick={() => setMode("signin")}
            className={`rounded-full py-2 transition ${
              mode === "signin" ? "bg-crayon-yellow shadow" : "text-stone-500"
            }`}
          >
            Accedi
          </button>
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={`rounded-full py-2 transition ${
              mode === "signup" ? "bg-crayon-yellow shadow" : "text-stone-500"
            }`}
          >
            Registrati
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            required
            autoComplete="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-2xl border-2 border-stone-200 px-4 py-3 outline-none focus:border-crayon-blue"
          />
          <input
            type="password"
            required
            minLength={8}
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            placeholder="Password (min 8 caratteri)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-2xl border-2 border-stone-200 px-4 py-3 outline-none focus:border-crayon-blue"
          />
          {error && (
            <p className="rounded-xl bg-red-50 p-3 text-sm text-red-600">
              {error}
            </p>
          )}
          {info && (
            <p className="rounded-xl bg-green-50 p-3 text-sm text-green-700">
              {info}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-crayon-purple py-3 text-lg font-extrabold text-white shadow-lg transition active:scale-95 disabled:opacity-50"
          >
            {loading
              ? "Un attimo..."
              : mode === "signin"
                ? "Entra"
                : "Crea account"}
          </button>
        </form>

        {mode === "signin" && (
          <button
            type="button"
            onClick={handleForgotPassword}
            className="mt-3 w-full text-center text-sm font-semibold text-stone-400 underline-offset-2 hover:underline"
          >
            Password dimenticata?
          </button>
        )}

        <div className="my-5 flex items-center gap-3 text-xs font-bold text-stone-300">
          <span className="h-px flex-1 bg-stone-200" />
          oppure
          <span className="h-px flex-1 bg-stone-200" />
        </div>

        <div className="space-y-2">
          <button
            type="button"
            onClick={() => handleOAuth("google")}
            disabled={oauthLoading !== null}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-stone-200 py-3 font-bold text-stone-600 transition hover:bg-stone-50 active:scale-95 disabled:opacity-50"
          >
            <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34.2 6.1 29.4 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z"/>
              <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34.2 6.1 29.4 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
              <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
              <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C41 35.4 44 30.2 44 24c0-1.3-.1-2.6-.4-3.9z"/>
            </svg>
            {oauthLoading === "google" ? "Un attimo..." : "Continua con Google"}
          </button>
          <button
            type="button"
            onClick={() => handleOAuth("apple")}
            disabled={oauthLoading !== null}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-black py-3 font-bold text-white transition active:scale-95 disabled:opacity-50"
          >
            <svg width="16" height="18" viewBox="0 0 814 1000" fill="currentColor" aria-hidden="true">
              <path d="M788 341c-6 4-107 61-107 190 0 149 131 202 135 203-1 3-21 72-69 142-43 62-88 124-156 124s-86-40-165-40c-77 0-104 41-167 41s-107-57-157-127C44 790 0 668 0 553c0-185 120-283 239-283 63 0 115 42 155 42 38 0 97-44 169-44 27 0 125 2 189 96zM554 127C586 89 608 36 608 0c0-5 0-10-1-14-52 2-113 34-150 77-29 33-56 86-56 122 0 6 1 11 1 13 3 1 8 1 13 1 46 0 104-31 139-72z"/>
            </svg>
            {oauthLoading === "apple" ? "Un attimo..." : "Continua con Apple"}
          </button>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
