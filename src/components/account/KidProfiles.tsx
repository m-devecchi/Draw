"use client";

import { Emoji } from "@/components/ui/Emoji";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export interface KidProfile {
  id: string;
  name: string;
  avatar: string;
}

const AVATARS = ["🦁", "🐰", "🦊", "🐼", "🐸", "🦄", "🐙", "🐝"] as const;

// Gestione dei profili bambino (le API filtrano per utente: ogni genitore vede
// e modifica solo i propri).
export function KidProfiles({ initialKids }: { initialKids: KidProfile[] }) {
  const router = useRouter();
  const [kids, setKids] = useState<KidProfile[]>(initialKids);
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState<string>(AVATARS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setKids(initialKids), [initialKids]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError(null);
    const res = await fetch("/api/kids", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), avatar }),
    }).catch(() => null);
    const data: KidProfile | null = res?.ok
      ? await res.json().catch(() => null)
      : null;
    setLoading(false);
    if (!data) {
      setError("Aggiunta non riuscita, riprova.");
      return;
    }
    setKids((k) => [...k, data]);
    setName("");
    router.refresh();
  }

  async function handleRemove(id: string) {
    const res = await fetch(`/api/kids/${id}`, { method: "DELETE" }).catch(
      () => null
    );
    if (res?.ok) {
      setKids((k) => k.filter((kid) => kid.id !== id));
      router.refresh();
    }
  }

  return (
    <div className="space-y-4">
      {kids.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {kids.map((kid) => (
            <li
              key={kid.id}
              className="ink-chip gap-2 py-1 pl-2 pr-1 text-sm"
            >
              <Emoji char={kid.avatar} size={26} decorative />
              {kid.name}
              <button
                type="button"
                aria-label={`Rimuovi ${kid.name}`}
                onClick={() => handleRemove(kid.id)}
                className="flex h-7 w-7 items-center justify-center rounded-full border border-line-strong bg-paper text-xs transition hover:bg-tomato-50 active:scale-90"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleAdd} className="space-y-3">
        <div className="flex flex-wrap gap-1.5">
          {AVATARS.map((a) => (
            <button
              key={a}
              type="button"
              aria-label={`Avatar ${a}`}
              aria-pressed={avatar === a}
              onClick={() => setAvatar(a)}
              className={`flex h-12 w-12 items-center justify-center rounded-full border border-line-strong transition active:scale-90 ${
                avatar === a ? "border-ink bg-sun-50 shadow-soft" : "bg-paper"
              }`}
            >
              <Emoji char={a} size={34} decorative />
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            type="text"
            value={name}
            maxLength={30}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nome del bambino"
            className="ink-field flex-1 !py-2.5"
          />
          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="ink-btn ink-btn-mint px-5 py-2.5"
          >
            {loading ? "..." : "＋ Aggiungi"}
          </button>
        </div>
      </form>
      {error && <p className="text-sm font-bold text-tomato">{error}</p>}
    </div>
  );
}
