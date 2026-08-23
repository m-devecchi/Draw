import { notFound, redirect } from "next/navigation";
import { DemoPrint } from "@/components/demo/DemoPrint";
import { PrintView } from "@/components/print/PrintView";
import { isDemoMode } from "@/lib/config";
import { parseStrokes } from "@/lib/strokes";
import { createClient } from "@/lib/supabase/server";

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

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // La RLS restituisce solo i disegni dell'utente.
  const { data: drawing } = await supabase
    .from("drawings")
    .select("id, prompt, content, fills, strokes")
    .eq("id", id)
    .single();
  if (!drawing) notFound();

  return (
    <PrintView
      content={drawing.content}
      fills={(drawing.fills ?? {}) as Record<string, string>}
      strokes={parseStrokes(drawing.strokes)}
      prompt={drawing.prompt}
    />
  );
}
