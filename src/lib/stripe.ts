import Stripe from "stripe";

// Stripe è predisposto ma opzionale: senza chiavi gli endpoint di billing
// rispondono 501 e l'app funziona con il solo piano free.
export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key);
}

export function isBillingConfigured(): boolean {
  return Boolean(
    process.env.STRIPE_SECRET_KEY &&
      process.env.STRIPE_WEBHOOK_SECRET &&
      process.env.STRIPE_PRICE_ID
  );
}
