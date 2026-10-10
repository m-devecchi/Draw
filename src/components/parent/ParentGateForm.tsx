"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { MathChallenge } from "@/lib/parent-gate";

export function ParentGateForm({
  hasPin,
  challenge,
  next,
}: {
  hasPin: boolean;
  challenge: MathChallenge | null;
  next: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const body = hasPin
        ? { pin: value }
        : { answer: Number(value), token: challenge!.token };
      const res = await fetch("/api/parent/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error ?? "Verifica non riuscita");
      }
      router.push(next);
      router.refresh();
    } catch (err) {
      setValue("");
      setError(err instanceof Error ? err.message : "Errore, riprova");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!hasPin && challenge && (
        <p className="text-center font-display text-4xl font-semibold">
          {challenge.a} × {challenge.b} = ?
        </p>
      )}
      <input
        type={hasPin ? "password" : "text"}
        inputMode="numeric"
        autoFocus
        required
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={hasPin ? "PIN" : "Risposta"}
        autoComplete={hasPin ? "current-password" : "off"}
        className="ink-field text-center text-2xl tracking-[0.4em]"
      />
      {error && (
        <p className="rounded-2xl border border-line-strong bg-tomato-50 p-3 text-center text-sm font-bold">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={loading || !value}
        className="ink-btn ink-btn-primary w-full py-3.5 text-lg"
      >
        {loading ? "Un attimo..." : "Entra"}
      </button>
      <Link
        href="/"
        className="block text-center text-sm font-bold text-ink-soft"
      >
        Torna ai disegni
      </Link>
    </form>
  );
}
