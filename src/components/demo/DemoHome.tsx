"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DrawingThumb } from "@/components/DrawingThumb";
import { PromptForm } from "@/components/PromptForm";
import { demoStore, type DemoDrawing } from "@/lib/demo-store";
import { SAMPLE_DRAWINGS } from "@/lib/samples";

// Home della modalità PoC: niente login, disegni salvati sul dispositivo.
export function DemoHome() {
  const router = useRouter();
  const [drawings, setDrawings] = useState<DemoDrawing[]>([]);

  useEffect(() => {
    setDrawings(demoStore.list());
  }, []);

  function handleDelete(id: string) {
    demoStore.remove(id);
    setDrawings(demoStore.list());
  }

  // Copia l'esempio nella galleria locale e apre la coloritura:
  // ogni tocco crea una copia nuova, così si può ricolorare da capo.
  function handleSample(slug: string) {
    const sample = SAMPLE_DRAWINGS.find((s) => s.slug === slug)!;
    const saved = window.localStorage.getItem("colora-last-age");
    const drawing = demoStore.add({
      prompt: sample.prompt,
      kind: "svg",
      content: sample.content,
      ageBand: saved ?? "big",
    });
    router.push(`/color/${drawing.id}`);
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
        <h2 className="mb-4 text-2xl font-extrabold">
          Cosa vuoi colorare oggi?
        </h2>
        <PromptForm remaining={999} />
        <p className="mt-4 text-xs text-stone-400">
          Versione dimostrativa: i disegni restano su questo dispositivo.
          Login, quota giornaliera e Premium si attivano configurando Supabase
          (vedi README).
        </p>
      </section>

      <section className="mt-8">
        <h2 className="mb-1 text-xl font-extrabold">
          Disegni di esempio — senza API key
        </h2>
        <p className="mb-3 text-sm text-stone-500">
          Prova subito la coloritura: tocca un esempio e via!
        </p>
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {SAMPLE_DRAWINGS.map((s) => (
            <li key={s.slug}>
              <button
                type="button"
                onClick={() => handleSample(s.slug)}
                className="block w-full rounded-3xl bg-white p-3 text-left shadow transition hover:shadow-lg active:scale-95"
              >
                <div
                  className="coloring-svg pointer-events-none mb-2 overflow-hidden rounded-2xl border border-stone-100"
                  dangerouslySetInnerHTML={{ __html: s.content }}
                />
                <p className="line-clamp-2 text-sm font-bold">{s.prompt}</p>
              </button>
            </li>
          ))}
        </ul>
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
                  className="block rounded-3xl bg-white p-3 shadow transition hover:shadow-lg active:scale-95"
                >
                  <DrawingThumb content={d.content} fills={d.fills} />
                  <p className="mt-2 line-clamp-2 text-sm font-bold">{d.prompt}</p>
                  <p className="mt-0.5 text-xs text-stone-400">
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
