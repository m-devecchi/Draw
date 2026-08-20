"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { AGE_BANDS, AGE_COOKIE, type AgeBand } from "@/lib/age-bands";

/**
 * Imposta l'età di chi disegna.
 *
 * È una scelta del genitore valida per il dispositivo, indipendente dai
 * profili bambino: la maggior parte delle famiglie non crea profili, e
 * l'esperienza giusta deve arrivare comunque.
 *
 * Il cookie è scritto dal server (server action): niente giri fragili tra
 * cookie scritti dal browser, middleware e cache.
 */
export async function setAgeBandAction(formData: FormData) {
  const band = String(formData.get("band"));
  if (!AGE_BANDS.includes(band as AgeBand)) return;

  const store = await cookies();
  store.set(AGE_COOKIE, band, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  revalidatePath("/", "layout");
}
