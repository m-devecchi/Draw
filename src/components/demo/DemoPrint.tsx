"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PrintView } from "@/components/print/PrintView";
import { demoStore, type DemoDrawing } from "@/lib/demo-store";

// Stampa in modalità PoC: il disegno vive sul dispositivo.
export function DemoPrint({ id }: { id: string }) {
  const [drawing, setDrawing] = useState<DemoDrawing | null | undefined>(
    undefined
  );

  useEffect(() => {
    setDrawing(demoStore.get(id) ?? null);
  }, [id]);

  if (drawing === undefined) {
    return (
      <main className="flex min-h-dvh items-center justify-center">
        <p className="animate-pulse text-stone-400">Preparo il foglio...</p>
      </main>
    );
  }

  if (drawing === null) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="text-5xl">🖨️</div>
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
    <PrintView
      drawings={[
        {
          id: drawing.id,
          prompt: drawing.prompt,
          content: drawing.content,
          fills: drawing.fills,
          strokes: drawing.strokes,
        },
      ]}
    />
  );
}
