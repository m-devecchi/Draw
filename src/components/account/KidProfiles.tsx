"use client";

import { Emoji } from "@/components/ui/Emoji";
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
              className="ink-chip gap-2 py-1 pl-2 pr-1 text-sm"
            >
              <Emoji char={kid.avatar} size={26} decorative />
              {kid.name}
              <button
                type="button"
                aria-label={`Rimuovi ${kid.name}`}
                onClick={() => handleRemove(kid.id)}
                className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-ink bg-paper text-xs transition hover:bg-tomato-50 active:scale-90"
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
              className={`flex h-12 w-12 items-center justify-center rounded-full border-2 border-ink transition active:scale-90 ${
                avatar === a ? "bg-sun shadow-[2px_2px_0_#1d1638]" : "bg-paper"
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
