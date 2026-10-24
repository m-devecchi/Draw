import { notFound, redirect } from "next/navigation";
import { DemoPrint } from "@/components/demo/DemoPrint";
import { PrintView } from "@/components/print/PrintView";
import { getCurrentUser } from "@/lib/auth/server";
import { getDrawing } from "@/lib/db/repo";
import { isDemoMode } from "@/lib/config";
import { parseStrokes } from "@/lib/strokes";

export const dynamic = "force-dynamic";

export default async function PrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (isDemoMode() || id.startsWith("demo-")) {
    return <DemoPrint id={id} />;
  }

  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const drawing = await getDrawing(user.id, id);
  if (!drawing) notFound();

  return (
    <PrintView
      drawings={[
        {
          id: drawing.id,
          prompt: drawing.prompt,
          content: drawing.content,
          fills: drawing.fills,
          strokes: parseStrokes(drawing.strokes),
        },
      ]}
    />
  );
}
