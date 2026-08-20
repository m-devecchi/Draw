import { notFound, redirect } from "next/navigation";
import { ColoringWorkspace } from "@/components/coloring/ColoringWorkspace";
import { DemoColoring } from "@/components/demo/DemoColoring";
import { isDemoMode } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ColorPage({
  params,
}: {
  params: Promise<{ id: string }>;
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
    .select("id, prompt, kind, content, fills")
    .eq("id", id)
    .single();
  if (!drawing) notFound();

  return (
    <main>
      <ColoringWorkspace
        drawingId={drawing.id}
        kind={drawing.kind as "svg" | "raster"}
        content={drawing.content}
        initialFills={(drawing.fills ?? {}) as Record<string, string>}
        prompt={drawing.prompt}
      />
    </main>
  );
}
