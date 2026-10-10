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
        className="ink-field flex-1 !py-2.5"
        placeholder="Come ti chiami?"
      />
      <button
        type="submit"
        disabled={state === "saving" || !name.trim()}
        className="ink-btn ink-btn-dark px-5 py-2.5"
      >
        {state === "saving" ? "..." : "Salva"}
      </button>
      {state === "saved" && (
        <span className="text-sm font-bold text-mint">✓ Salvato</span>
      )}
      {state === "error" && (
        <span className="text-sm font-bold text-tomato">Errore, riprova</span>
      )}
    </form>
  );
}
