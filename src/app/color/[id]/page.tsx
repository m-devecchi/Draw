import { notFound, redirect } from "next/navigation";
import { ColoringWorkspace } from "@/components/coloring/ColoringWorkspace";
import { DemoColoring } from "@/components/demo/DemoColoring";
import { isDemoMode } from "@/lib/config";
import { parseStrokes } from "@/lib/strokes";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ColorPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ kid?: string }>;
}) {
  const { id } = await params;
  if (isDemoMode() || id.startsWith("demo-")) {
    return <DemoColoring id={id} />;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // La RLS restituisce solo i disegni dell'utente.
  const { data: drawing } = await supabase
    .from("drawings")
    .select("id, prompt, kind, content, fills, strokes, kid_id")
    .eq("id", id)
    .single();
  if (!drawing) notFound();

  // Fascia d'età del bambino a cui appartiene il disegno: decide colori,
  // effetti e strumenti. Se la migrazione non è applicata resta il default.
  let ageBand: string | null = null;
  const kidId = (drawing as { kid_id?: string | null }).kid_id;
  if (kidId) {
    const { data: kid } = await supabase
      .from("kid_profiles")
      .select("age_band")
      .eq("id", kidId)
      .maybeSingle();
    ageBand = kid?.age_band ?? null;
  }

  // Torna alla home mantenendo il bambino selezionato (solo un id valido).
  const kid = (await searchParams).kid;
  const backHref =
    kid && /^[0-9a-f-]{36}$/i.test(kid)
      ? `/?kid=${encodeURIComponent(kid)}`
      : "/";

  return (
    <main>
      <ColoringWorkspace
        drawingId={drawing.id}
        kind={drawing.kind as "svg" | "raster"}
        content={drawing.content}
        initialFills={(drawing.fills ?? {}) as Record<string, string>}
        initialStrokes={parseStrokes(drawing.strokes)}
        ageBand={ageBand}
        prompt={drawing.prompt}
        backHref={backHref}
      />
    </main>
  );
}
