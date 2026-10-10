"use client";

import { Emoji } from "@/components/ui/Emoji";
import Link from "next/link";
import { useEffect, useState } from "react";
import { PrintView, type PrintableDrawing } from "@/components/print/PrintView";
import { demoStore } from "@/lib/demo-store";

// Stampa multipla in modalità PoC: i disegni vivono sul dispositivo.
export function DemoPrintBatch({ ids }: { ids: string[] }) {
  const [drawings, setDrawings] = useState<PrintableDrawing[] | null>(null);

  useEffect(() => {
    setDrawings(
      ids
        .map((id) => demoStore.get(id))
        .filter((d): d is NonNullable<typeof d> => Boolean(d))
        .map((d) => ({
          id: d.id,
          prompt: d.prompt,
          content: d.content,
          fills: d.fills,
          strokes: d.strokes,
        }))
    );
  }, [ids]);

  if (drawings === null) {
    return (
      <main className="flex min-h-dvh items-center justify-center">
        <p className="animate-pulse font-display text-xl font-bold text-ink-soft">Preparo i fogli...</p>
      </main>
    );
  }

  if (!drawings.length) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
        <Emoji char="🖼️" size={80} decorative />
        <p className="font-bold text-ink-soft">
          Nessuno di questi disegni si trova su questo dispositivo.
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

  return <PrintView drawings={drawings} />;
}
