import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

// Salvataggio dei colori applicati: mappa indice-regione → colore hex.
const fillsSchema = z.record(
  z.string().regex(/^\d+$/),
  z.string().regex(/^#[0-9a-fA-F]{6}$/)
);

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
  const parsed = z.object({ fills: fillsSchema }).safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dati non validi" }, { status: 400 });
  }

  // La RLS garantisce che si possano aggiornare solo i propri disegni.
  const { error } = await supabase
    .from("drawings")
    .update({ fills: parsed.data.fills, updated_at: new Date().toISOString() })
    .eq("id", id);
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
