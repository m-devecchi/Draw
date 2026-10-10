"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DrawingGallery } from "@/components/DrawingGallery";
import { PromptForm } from "@/components/PromptForm";
import { EmptyGallery } from "@/components/fun/EmptyGallery";
import { Footer } from "@/components/fun/Footer";
import { HomeHero, Scribble, SectionTitle } from "@/components/fun/HomeHero";
import { Logo } from "@/components/fun/Logo";
import { demoStore, type DemoDrawing } from "@/lib/demo-store";
import { SAMPLE_DRAWINGS } from "@/lib/samples";
import { refineLines } from "@/lib/refine-lines";

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
    <main className="mx-auto max-w-5xl px-4 pb-10 pt-5 sm:px-6 sm:pt-8">
      <header className="mb-6 flex items-center justify-between gap-3">
        <Logo />
        <span className="ink-chip bg-mint-50">Prova senza account</span>
      </header>

      <HomeHero
        title={
          <>
            Cosa <Scribble>coloriamo</Scribble> oggi?
          </>
        }
      >
        <PromptForm remaining={999} />
        <p className="mt-4 text-xs font-semibold text-ink/60">
          Versione dimostrativa: i disegni restano su questo dispositivo.
        </p>
      </HomeHero>

      <section className="mt-12">
        <SectionTitle
          title="Disegni di esempio"
          hint="Pronti da colorare subito: tocca e via."
        />
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-5">
          {SAMPLE_DRAWINGS.map((s, i) => (
            <li
              key={s.slug}
              className="rise-in"
              style={{ "--i": i } as React.CSSProperties}
            >
              <button
                type="button"
                onClick={() => handleSample(s.slug)}
                className="ink-card drawing-card block w-full p-2.5 text-left"
              >
                <div
                  className="coloring-svg pointer-events-none overflow-hidden rounded-2xl border border-line"
                  dangerouslySetInnerHTML={{ __html: refineLines(s.content) }}
                />
                <p className="mt-2 line-clamp-2 px-1 font-display text-[1.02rem] font-semibold leading-tight">
                  {s.prompt}
                </p>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12">
        <SectionTitle title="I tuoi disegni" />
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
      <Footer />
    </main>
  );
}
