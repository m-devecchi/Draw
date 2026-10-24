import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/server";
import { deleteDrawing, updateDrawing } from "@/lib/db/repo";

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
  const user = await getCurrentUser();
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

  // Si aggiornano solo i disegni dell'utente: se l'id non e' suo, 404.
  try {
    const found = await updateDrawing(user.id, id, {
      fills: parsed.data.fills,
      strokes: parsed.data.strokes,
    });
    if (!found) {
      return NextResponse.json({ error: "Disegno non trovato" }, { status: 404 });
    }
  } catch {
    return NextResponse.json({ error: "Salvataggio fallito" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  }

  try {
    await deleteDrawing(user.id, id);
  } catch {
    return NextResponse.json({ error: "Cancellazione fallita" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
