"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";

  const [mode, setMode] = useState<"signin" | "signup">("signin");
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
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (error) throw error;
        if (data.session) {
          router.push(next);
          router.refresh();
        } else {
          setInfo("Controlla la tua email per confermare la registrazione.");
        }
      }
    } catch (err) {
      setError(
        err instanceof Error && err.message === "Invalid login credentials"
          ? "Email o password non corretti."
          : err instanceof Error
            ? err.message
            : "Qualcosa è andato storto, riprova."
      );
    } finally {
      setLoading(false);
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
