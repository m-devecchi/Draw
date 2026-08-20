"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ColoringWorkspace } from "@/components/coloring/ColoringWorkspace";
import { demoStore, type DemoDrawing } from "@/lib/demo-store";

// Pagina di coloritura della modalità PoC: carica il disegno dal dispositivo.
export function DemoColoring({ id }: { id: string }) {
  const [drawing, setDrawing] = useState<DemoDrawing | null | undefined>(
    undefined
  );

  useEffect(() => {
    setDrawing(demoStore.get(id) ?? null);
  }, [id]);

  if (drawing === undefined) {
    return (
      <main className="flex min-h-dvh items-center justify-center">
        <p className="animate-pulse text-stone-400">Carico il disegno...</p>
      </main>
    );
  }

  if (drawing === null) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="text-5xl">🎨</div>
        <p className="font-bold text-stone-500">
          Disegno non trovato su questo dispositivo.
        </p>
        <Link
          href="/"
          className="rounded-full bg-crayon-purple px-6 py-3 font-extrabold text-white shadow-lg"
        >
          Torna ai disegni
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl p-4 pb-16 sm:p-6">
      <header className="mb-4 flex items-center justify-between">
        <Link
          href="/"
          className="rounded-full bg-white px-4 py-2 text-sm font-extrabold shadow transition active:scale-95"
        >
          ← Indietro
        </Link>
        <h1 className="line-clamp-1 px-3 text-center font-extrabold text-stone-600">
          {drawing.prompt}
        </h1>
        <span className="w-20" />
      </header>

      <ColoringWorkspace
        drawingId={drawing.id}
        kind={drawing.kind}
        content={drawing.content}
        initialFills={drawing.fills}
        mode="demo"
      />
    </main>
  );
}
