import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { getProfile, setStripeCustomer } from "@/lib/db/repo";
import { isParentUnlocked } from "@/lib/parent-gate";
import { getStripe, isBillingConfigured } from "@/lib/stripe";

// Crea una sessione di Stripe Checkout per l'abbonamento Premium.
export async function POST() {
  if (!isBillingConfigured()) {
    return NextResponse.json(
      { error: "I pagamenti non sono ancora attivi." },
      { status: 501 }
    );
  }

  const user = await getCurrentUser();
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
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  // Riusa (o crea) il customer Stripe collegato al profilo.
  const profile = await getProfile(user.id);

  let customerId = profile?.stripeCustomerId ?? null;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email ?? undefined,
      metadata: { user_id: user.id },
    });
    customerId = customer.id;
    await setStripeCustomer(user.id, customerId);
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: process.env.STRIPE_PRICE_ID!, quantity: 1 }],
    success_url: `${appUrl}/?upgraded=1`,
    cancel_url: `${appUrl}/`,
    metadata: { user_id: user.id },
  });

  return NextResponse.json({ url: session.url });
}
