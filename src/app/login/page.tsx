"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AutoColorDemo } from "@/components/fun/AutoColorDemo";
import { Logo } from "@/components/fun/Logo";
import { SAMPLE_DRAWINGS } from "@/lib/samples";

const DEMO =
  SAMPLE_DRAWINGS.find((s) => s.slug === "castello") ?? SAMPLE_DRAWINGS[0];

// POST JSON; se la risposta non è ok lancia un errore col messaggio del server.
async function post(url: string, body: object) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error ?? "Qualcosa è andato storto, riprova.");
  return data;
}

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

    try {
      if (mode === "signup") {
        // Il server crea l'account già confermato; poi si entra subito.
        await post("/api/auth/signup", { email, password });
      }
      await post("/api/auth/login", { email, password });
      router.push(next);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Qualcosa è andato storto, riprova."
      );
    } finally {
      setLoading(false);
    }
  }

  // Login con Google / Apple: si passa dalla pagina di accesso di Cognito
  // (i provider vanno abilitati sullo user pool).
  function handleOAuth(provider: "google" | "apple") {
    setError(null);
    setOauthLoading(provider);
    window.location.href = `/auth/oauth?provider=${provider}&next=${encodeURIComponent(next)}`;
  }

  // Manda il codice di recupero e porta alla pagina dove inserirlo.
  async function handleForgotPassword() {
    setError(null);
    setInfo(null);
    if (!email) {
      setError("Scrivi prima la tua email qui sopra, poi ripremi il link.");
      return;
    }
    try {
      await post("/api/auth/forgot", { email });
      router.push(`/login/reset?email=${encodeURIComponent(email)}`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Invio non riuscito, riprova tra qualche minuto."
      );
    }
  }

  return (
    <main className="mx-auto grid min-h-dvh max-w-5xl content-center items-center gap-7 px-4 py-6 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:gap-12">
      {/* Presentazione: cosa fa l'app, mostrato e non spiegato */}
      <section className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-3 lg:flex lg:flex-col lg:items-start lg:gap-6">
        <Logo as="div" size="text-[2.6rem] sm:text-6xl" />
        <p className="col-start-1 font-display text-xl font-semibold leading-snug [text-wrap:balance] sm:text-3xl lg:max-w-md">
          Scrivi cosa vuoi disegnare. Diventa un foglio da colorare con un
          tocco.
        </p>
        <div className="col-start-2 row-span-2 row-start-1 w-32 rotate-3 rounded-3xl border border-line bg-paper p-1.5 shadow-soft sm:w-56 sm:p-2.5 lg:w-80 lg:-rotate-2">
          <AutoColorDemo content={DEMO.content} className="overflow-hidden rounded-2xl" />
        </div>
      </section>

      <div className="ink-card mx-auto w-full max-w-md p-6 sm:p-8">
        <h1 className="mb-1 font-display text-3xl font-semibold">
          {mode === "signin" ? "Bentornato!" : "Crea il tuo account"}
        </h1>
        <p className="mb-5 font-semibold text-ink-soft">
          {mode === "signin"
            ? "Entra per ritrovare i tuoi disegni."
            : "Gratis, con due disegni nuovi ogni giorno."}
        </p>

        <div className="mb-5 grid grid-cols-2 gap-1 rounded-2xl border border-line bg-canvas p-1 font-display font-semibold">
          <button
            type="button"
            onClick={() => setMode("signin")}
            aria-pressed={mode === "signin"}
            className={`rounded-xl py-2 transition ${
              mode === "signin" ? "bg-paper shadow-soft" : "text-ink-soft"
            }`}
          >
            Accedi
          </button>
          <button
            type="button"
            onClick={() => setMode("signup")}
            aria-pressed={mode === "signup"}
            className={`rounded-xl py-2 transition ${
              mode === "signup" ? "bg-paper shadow-soft" : "text-ink-soft"
            }`}
          >
            Registrati
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
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
            type="password"
            required
            minLength={8}
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            placeholder="Password (min 8 caratteri)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="ink-field"
          />
          {error && (
            <p role="alert" className="rounded-2xl border border-line-strong bg-tomato-50 p-3 text-sm font-bold">
              {error}
            </p>
          )}
          {info && (
            <p className="rounded-2xl border border-line-strong bg-mint-50 p-3 text-sm font-bold">
              {info}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="ink-btn ink-btn-primary mt-1 w-full py-3.5 text-xl"
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
            className="mt-3 w-full text-center text-sm font-bold text-ink-soft underline-offset-2 hover:underline"
          >
            Password dimenticata?
          </button>
        )}

        <div className="my-5 flex items-center gap-3 text-xs font-extrabold uppercase tracking-wider text-ink-soft">
          <span className="h-px flex-1 bg-line" />
          oppure
          <span className="h-px flex-1 bg-line" />
        </div>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => handleOAuth("google")}
            disabled={oauthLoading !== null}
            className="ink-btn w-full py-3 text-base"
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
            className="ink-btn ink-btn-dark w-full py-3 text-base"
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
