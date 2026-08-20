"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PromptForm } from "@/components/PromptForm";
import { demoStore, type DemoDrawing } from "@/lib/demo-store";

// Home della modalità PoC: niente login, disegni salvati sul dispositivo.
export function DemoHome() {
  const [drawings, setDrawings] = useState<DemoDrawing[]>([]);

  useEffect(() => {
    setDrawings(demoStore.list());
  }, []);

  function handleDelete(id: string) {
    demoStore.remove(id);
    setDrawings(demoStore.list());
  }

  return (
    <main className="mx-auto max-w-3xl p-4 pb-16 sm:p-6">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-extrabold text-crayon-purple">
          🖍️ Colora
        </h1>
        <span className="rounded-full bg-crayon-yellow/60 px-3 py-1 text-xs font-bold">
          PoC · senza account
        </span>
      </header>

      <section className="rounded-3xl bg-white p-6 shadow-xl">
        <h2 className="mb-1 text-xl font-extrabold">
          Cosa vuoi colorare oggi?
        </h2>
        <p className="mb-4 text-sm text-stone-500">
          Scrivi un&apos;idea e creiamo il disegno: poi tocca le aree per
          riempirle di colore!
        </p>
        <PromptForm remaining={999} />
        <p className="mt-4 text-xs text-stone-400">
          Versione dimostrativa: i disegni restano su questo dispositivo.
          Login, quota giornaliera e Premium si attivano configurando Supabase
          (vedi README).
        </p>
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-xl font-extrabold">I tuoi disegni</h2>
        {!drawings.length ? (
          <p className="rounded-3xl bg-white/60 p-8 text-center text-stone-400">
            Ancora nessun disegno: creane uno qui sopra! 🎨
          </p>
        ) : (
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {drawings.map((d) => (
              <li key={d.id} className="relative">
                <Link
                  href={`/color/${d.id}`}
                  className="block rounded-3xl bg-white p-4 shadow transition hover:shadow-lg active:scale-95"
                >
                  <div className="mb-2 text-4xl">🎨</div>
                  <p className="line-clamp-2 font-bold">{d.prompt}</p>
                  <p className="mt-1 text-xs text-stone-400">
                    {new Date(d.createdAt).toLocaleDateString("it-IT")}
                  </p>
                </Link>
                <button
                  type="button"
                  aria-label="Elimina disegno"
                  onClick={() => handleDelete(d.id)}
                  className="absolute right-2 top-2 rounded-full bg-stone-100 px-2 py-1 text-xs text-stone-400 transition hover:bg-red-100 hover:text-red-500"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
