"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function ProfileNameForm({ initialName }: { initialName: string }) {
  const [name, setName] = useState(initialName);
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">(
    "idle"
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("saving");
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return setState("error");
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: name.trim() })
      .eq("id", user.id);
    setState(error ? "error" : "saved");
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-2">
      <input
        type="text"
        value={name}
        maxLength={40}
        onChange={(e) => {
          setName(e.target.value);
          setState("idle");
        }}
        className="flex-1 rounded-2xl border-2 border-stone-200 px-4 py-2 outline-none focus:border-crayon-blue"
        placeholder="Come ti chiami?"
      />
      <button
        type="submit"
        disabled={state === "saving" || !name.trim()}
        className="rounded-full bg-crayon-blue px-5 py-2 font-extrabold text-white shadow transition active:scale-95 disabled:opacity-50"
      >
        {state === "saving" ? "..." : "Salva"}
      </button>
      {state === "saved" && (
        <span className="text-sm font-semibold text-crayon-green">✓ Salvato</span>
      )}
      {state === "error" && (
        <span className="text-sm text-red-500">Errore, riprova</span>
      )}
    </form>
  );
}
