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
    <main>
      <ColoringWorkspace
        drawingId={drawing.id}
        kind={drawing.kind}
        content={drawing.content}
        initialFills={drawing.fills}
        initialStrokes={drawing.strokes}
        mode="demo"
        prompt={drawing.prompt}
      />
    </main>
  );
}
