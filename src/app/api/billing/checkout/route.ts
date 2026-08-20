import { NextResponse } from "next/server";
import { isParentUnlocked } from "@/lib/parent-gate";
import { getStripe, isBillingConfigured } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// Crea una sessione di Stripe Checkout per l'abbonamento Premium.
export async function POST() {
  if (!isBillingConfigured()) {
    return NextResponse.json(
      { error: "I pagamenti non sono ancora attivi." },
      { status: 501 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  }

  // Un pagamento non parte mai dalle mani del bambino.
  if (!(await isParentUnlocked(user.id))) {
    return NextResponse.json(
      { error: "Serve l'area genitori.", needsParent: true },
      { status: 403 }
    );
  }

  const stripe = getStripe()!;
  const admin = createAdminClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  // Riusa (o crea) il customer Stripe collegato al profilo.
  const { data: profile } = await admin
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single();

  let customerId = profile?.stripe_customer_id ?? null;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email ?? undefined,
      metadata: { supabase_user_id: user.id },
    });
    customerId = customer.id;
    await admin
      .from("profiles")
      .update({ stripe_customer_id: customerId })
      .eq("id", user.id);
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: process.env.STRIPE_PRICE_ID!, quantity: 1 }],
    success_url: `${appUrl}/?upgraded=1`,
    cancel_url: `${appUrl}/`,
    metadata: { supabase_user_id: user.id },
  });

  return NextResponse.json({ url: session.url });
}
