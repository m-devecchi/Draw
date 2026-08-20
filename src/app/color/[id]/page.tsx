import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ColoringWorkspace } from "@/components/coloring/ColoringWorkspace";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ColorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // La RLS restituisce solo i disegni dell'utente.
  const { data: drawing } = await supabase
    .from("drawings")
    .select("id, prompt, kind, content, fills")
    .eq("id", id)
    .single();
  if (!drawing) notFound();

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
        kind={drawing.kind as "svg" | "raster"}
        content={drawing.content}
        initialFills={(drawing.fills ?? {}) as Record<string, string>}
      />
    </main>
  );
}
