"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export interface KidProfile {
  id: string;
  name: string;
  avatar: string;
}

const AVATARS = ["🦁", "🐰", "🦊", "🐼", "🐸", "🦄", "🐙", "🐝"] as const;

// Gestione dei profili bambino (CRUD diretto via RLS: ogni genitore vede
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
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return setLoading(false);
    const { data, error } = await supabase
      .from("kid_profiles")
      .insert({ user_id: user.id, name: name.trim(), avatar })
      .select("id, name, avatar")
      .single();
    setLoading(false);
    if (error || !data) {
      setError(
        "Aggiunta non riuscita. Se è la prima volta: va applicata la migrazione 0002_kids.sql su Supabase."
      );
      return;
    }
    setKids((k) => [...k, data]);
    setName("");
    router.refresh();
  }

  async function handleRemove(id: string) {
    const supabase = createClient();
    const { error } = await supabase.from("kid_profiles").delete().eq("id", id);
    if (!error) {
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
              className="flex items-center gap-2 rounded-full bg-stone-50 py-1.5 pl-3 pr-1.5 font-bold"
            >
              <span className="text-xl">{kid.avatar}</span>
              {kid.name}
              <button
                type="button"
                aria-label={`Rimuovi ${kid.name}`}
                onClick={() => handleRemove(kid.id)}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-xs text-stone-400 shadow-sm transition hover:text-red-500 active:scale-90"
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
              className={`flex h-11 w-11 items-center justify-center rounded-full text-2xl transition active:scale-90 ${
                avatar === a
                  ? "bg-crayon-yellow shadow ring-2 ring-stone-600/50"
                  : "bg-stone-50"
              }`}
            >
              {a}
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
            className="flex-1 rounded-2xl border-2 border-stone-200 px-4 py-2 outline-none focus:border-crayon-blue"
          />
          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="rounded-full bg-crayon-green px-5 py-2 font-extrabold text-white shadow transition active:scale-95 disabled:opacity-50"
          >
            {loading ? "..." : "＋ Aggiungi"}
          </button>
        </div>
      </form>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
