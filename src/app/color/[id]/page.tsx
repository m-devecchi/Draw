import { notFound, redirect } from "next/navigation";
import { ColoringWorkspace } from "@/components/coloring/ColoringWorkspace";
import { DemoColoring } from "@/components/demo/DemoColoring";
import { getCurrentUser } from "@/lib/auth/server";
import { getDrawing } from "@/lib/db/repo";
import { isDemoMode } from "@/lib/config";
import { parseStrokes } from "@/lib/strokes";

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

  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const drawing = await getDrawing(user.id, id);
  if (!drawing) notFound();

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
        kind={drawing.kind}
        content={drawing.content}
        initialFills={drawing.fills}
        initialStrokes={parseStrokes(drawing.strokes)}
        ageBand={drawing.ageBand}
        prompt={drawing.prompt}
        backHref={backHref}
      />
    </main>
  );
}
