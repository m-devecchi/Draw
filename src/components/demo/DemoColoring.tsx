"use client";

import { Emoji } from "@/components/ui/Emoji";
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
        <p className="animate-pulse font-display text-xl font-bold text-ink-soft">Carico il disegno...</p>
      </main>
    );
  }

  if (drawing === null) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
        <Emoji char="🎨" size={80} decorative />
        <p className="font-bold text-ink-soft">
          Disegno non trovato su questo dispositivo.
        </p>
        <Link
          href="/"
          className="ink-btn ink-btn-primary px-6 py-3 text-lg"
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
        ageBand={drawing.ageBand}
        mode="demo"
        prompt={drawing.prompt}
      />
    </main>
  );
}
