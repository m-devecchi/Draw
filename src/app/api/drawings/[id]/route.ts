import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

// Salvataggio dei colori applicati: mappa indice-regione → riempimento.
// Il riempimento è un colore hex con un effetto facoltativo in coda
// ("#ff5c5c" oppure "#ff5c5c:gradient").
const fillsSchema = z.record(
  z.string().regex(/^\d+$/),
  z.string().regex(/^#[0-9a-fA-F]{6}(:[a-z]{3,12})?$/)
);

// Tratti a mano libera. Il percorso accetta solo comandi M/L con numeri:
// niente stringhe arbitrarie che finirebbero nel DOM.
const strokesSchema = z.array(
  z.object({
    d: z
      .string()
      .max(20000)
      .regex(/^M[\d\s.,-]+(L[\d\s.,-]+)*$/),
    c: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    w: z.number().min(1).max(80),
  })
).max(400);

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = z
    .object({ fills: fillsSchema, strokes: strokesSchema.optional() })
    .safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dati non validi" }, { status: 400 });
  }

  const update: Record<string, unknown> = {
    fills: parsed.data.fills,
    updated_at: new Date().toISOString(),
  };
  if (parsed.data.strokes) update.strokes = parsed.data.strokes;

  // La RLS garantisce che si possano aggiornare solo i propri disegni.
  const { error } = await supabase.from("drawings").update(update).eq("id", id);
  if (error) {
    return NextResponse.json({ error: "Salvataggio fallito" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  }

  const { error } = await supabase.from("drawings").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: "Cancellazione fallita" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
