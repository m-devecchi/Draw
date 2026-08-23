import { redirect } from "next/navigation";
import { DemoPrintBatch } from "@/components/demo/DemoPrintBatch";
import { PrintView } from "@/components/print/PrintView";
import { isDemoMode } from "@/lib/config";
import { parseStrokes } from "@/lib/strokes";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const MAX_SHEETS = 20; // oltre non è più una stampa, è una risma

export default async function PrintBatchPage({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string }>;
}) {
  const ids = ((await searchParams).ids ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean)
    .slice(0, MAX_SHEETS);

  if (!ids.length) redirect("/");

  // In demo i disegni vivono sul dispositivo: li carica il client.
  if (isDemoMode() || ids.every((id) => id.startsWith("demo-"))) {
    return <DemoPrintBatch ids={ids} />;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // La RLS restituisce solo i disegni dell'utente.
  const { data } = await supabase
    .from("drawings")
    .select("id, prompt, content, fills, strokes")
    .in("id", ids);
  if (!data?.length) redirect("/");

  // Si rispetta l'ordine in cui il genitore li ha scelti.
  const byId = new Map(data.map((d) => [d.id, d]));
  const drawings = ids
    .map((id) => byId.get(id))
    .filter((d): d is NonNullable<typeof d> => Boolean(d))
    .map((d) => ({
      id: d.id,
      prompt: d.prompt,
      content: d.content,
      fills: (d.fills ?? {}) as Record<string, string>,
      strokes: parseStrokes(d.strokes),
    }));

  return <PrintView drawings={drawings} />;
}
