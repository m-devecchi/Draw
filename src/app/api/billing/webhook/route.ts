import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { setPlanByCustomer } from "@/lib/db/repo";
import { getStripe } from "@/lib/stripe";

// Webhook Stripe: unica fonte di verità per lo stato dell'abbonamento.
// Configurare l'endpoint su Stripe con gli eventi:
//   checkout.session.completed, customer.subscription.updated,
//   customer.subscription.deleted
export async function POST(request: Request) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !webhookSecret) {
    return NextResponse.json({ error: "Billing non configurato" }, { status: 501 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Firma mancante" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      await request.text(),
      signature,
      webhookSecret
    );
  } catch {
    return NextResponse.json({ error: "Firma non valida" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      if (session.mode === "subscription" && session.customer) {
        await setPlanByCustomer(
          session.customer as string,
          "premium",
          (session.subscription as string) ?? null
        );
      }
      break;
    }
    case "customer.subscription.updated": {
      const sub = event.data.object;
      const active = sub.status === "active" || sub.status === "trialing";
      await setPlanByCustomer(
        sub.customer as string,
        active ? "premium" : "free",
        active ? sub.id : null
      );
      break;
    }
    case "customer.subscription.deleted": {
      const sub = event.data.object;
      await setPlanByCustomer(sub.customer as string, "free", null);
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
