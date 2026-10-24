import { redirect } from "next/navigation";
import { DemoPrintBatch } from "@/components/demo/DemoPrintBatch";
import { PrintView } from "@/components/print/PrintView";
import { getCurrentUser } from "@/lib/auth/server";
import { getDrawingsByIds } from "@/lib/db/repo";
import { isDemoMode } from "@/lib/config";
import { parseStrokes } from "@/lib/strokes";

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

  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const data = await getDrawingsByIds(user.id, ids);
  if (!data.length) redirect("/");

  // Si rispetta l'ordine in cui il genitore li ha scelti.
  const byId = new Map(data.map((d) => [d.id, d]));
  const drawings = ids
    .map((id) => byId.get(id))
    .filter((d): d is NonNullable<typeof d> => Boolean(d))
    .map((d) => ({
      id: d.id,
      prompt: d.prompt,
      content: d.content,
      fills: d.fills,
      strokes: parseStrokes(d.strokes),
    }));

  return <PrintView drawings={drawings} />;
}
