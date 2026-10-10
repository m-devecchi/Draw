"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DrawingGallery } from "@/components/DrawingGallery";
import { PromptForm } from "@/components/PromptForm";
import { EmptyGallery } from "@/components/fun/EmptyGallery";
import { Logo } from "@/components/fun/Logo";
import { PlayfulBackdrop } from "@/components/fun/PlayfulBackdrop";
import { demoStore, type DemoDrawing } from "@/lib/demo-store";
import { SAMPLE_DRAWINGS } from "@/lib/samples";

const TILTS = [-2.5, 1.8, -1.2, 2.4];

// Home della modalità PoC: niente login, disegni salvati sul dispositivo.
export function DemoHome() {
  const router = useRouter();
  const [drawings, setDrawings] = useState<DemoDrawing[]>([]);

  useEffect(() => {
    setDrawings(demoStore.list());
  }, []);

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
    <main className="relative mx-auto max-w-3xl p-4 pb-16 sm:p-6">
      <PlayfulBackdrop />
      <header className="mb-6 flex items-center justify-between">
        <Logo />
        <span className="rotate-2 rounded-full bg-crayon-yellow px-3 py-1 text-xs font-extrabold shadow-[0_3px_0_#e0a800]">
          PoC · senza account
        </span>
      </header>

      <section className="card-sticker pop-in rounded-[2rem] bg-white/95 p-6 backdrop-blur">
        <h2 className="mb-4 font-display text-3xl font-semibold leading-tight">
          Cosa vuoi <span className="rainbow-text">colorare</span> oggi?
        </h2>
        <PromptForm remaining={999} />
        <p className="mt-4 text-xs text-stone-400">
          Versione dimostrativa: i disegni restano su questo dispositivo.
          Login, quota giornaliera e Premium si attivano configurando Supabase
          (vedi README).
        </p>
      </section>

      <section className="mt-8">
        <h2 className="mb-1 font-display text-2xl font-semibold">
          Disegni di esempio — senza API key
        </h2>
        <p className="mb-3 text-sm text-stone-500">
          Prova subito la coloritura: tocca un esempio e via!
        </p>
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {SAMPLE_DRAWINGS.map((s, i) => (
            <li
              key={s.slug}
              className="pop-in"
              style={{ "--i": i } as React.CSSProperties}
            >
              <button
                type="button"
                onClick={() => handleSample(s.slug)}
                className="polaroid card-sticker block w-full rounded-3xl bg-white p-3 text-left hover:shadow-2xl active:scale-95"
                style={{ "--tilt": `${TILTS[i % TILTS.length]}deg` } as React.CSSProperties}
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
        <h2 className="mb-3 font-display text-2xl font-semibold">
          I tuoi disegni
        </h2>
        {!drawings.length ? (
          <EmptyGallery />
        ) : (
          <DrawingGallery
            mode="demo"
            onChanged={() => setDrawings(demoStore.list())}
            drawings={drawings.map((d) => ({
              id: d.id,
              prompt: d.prompt,
              content: d.content,
              fills: d.fills,
              strokes: d.strokes,
              createdAt: d.createdAt,
            }))}
          />
        )}
      </section>
    </main>
  );
}

