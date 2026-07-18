import Stripe from "stripe";

// Re-export the plan constants so existing server imports from "@/lib/stripe"
// keep working; the source of truth is the client-safe lib/plan.ts.
export { FREE_GENERATIONS, PRICE_LABEL } from "@/lib/plan";

// Stripe is optional — the app runs without it (generation just relies on the
// free trial / stays open if you never configure billing). Server-only.

export function isStripeConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY && !!process.env.STRIPE_PRICE_ID;
}

let _stripe: Stripe | null = null;
export function getStripe(): Stripe | null {
  if (!process.env.STRIPE_SECRET_KEY) return null;
  if (!_stripe) _stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  return _stripe;
}
