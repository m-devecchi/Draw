"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { DrawingThumb } from "./DrawingThumb";

// Card della galleria: anteprima colorata + eliminazione con conferma.
export function DrawingCard({
  id,
  prompt,
  content,
  fills,
  createdAt,
  badge,
  href,
}: {
  id: string;
  prompt: string;
  content: string;
  fills: Record<string, string>;
  createdAt: string;
  /** Avatar del bambino a cui appartiene il disegno. */
  badge?: string;
  href: string;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    const res = await fetch(`/api/drawings/${id}`, { method: "DELETE" });
    if (res.ok) {
      router.refresh();
    } else {
      setDeleting(false);
      setConfirming(false);
    }
  }

  return (
    <div className="relative">
      <Link
        href={href}
        className="block rounded-3xl bg-white p-3 shadow transition hover:shadow-lg active:scale-95"
      >
        <DrawingThumb content={content} fills={fills} />
        <p className="mt-2 line-clamp-2 text-sm font-bold">{prompt}</p>
        <p className="mt-0.5 text-xs text-stone-400">
          {badge ? `${badge} · ` : ""}
          {new Date(createdAt).toLocaleDateString("it-IT")}
        </p>
      </Link>

      {/* Cestino: appare sopra la card, non dentro il link */}
      <button
        type="button"
        aria-label={`Elimina il disegno ${prompt}`}
        onClick={() => setConfirming(true)}
        className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-sm shadow-md backdrop-blur transition hover:bg-red-50 active:scale-90"
      >
        🗑️
      </button>

      {confirming && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-3xl bg-white/95 p-3 text-center backdrop-blur">
          <p className="text-sm font-bold text-stone-600">
            Butto via questo disegno?
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="rounded-full bg-red-500 px-4 py-2 text-sm font-extrabold text-white shadow transition active:scale-95 disabled:opacity-50"
            >
              {deleting ? "..." : "Sì, butta"}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="rounded-full bg-stone-100 px-4 py-2 text-sm font-bold text-stone-600 transition active:scale-95"
            >
              No
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
