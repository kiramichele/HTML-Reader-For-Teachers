import Stripe from "stripe";

// Stripe is optional — the app runs without it (generation just relies on the
// free trial / stays open if you never configure billing). Server-only.
export const TRIAL_DAYS = 30;
export const PRICE_LABEL = "$10 / month";

export function isStripeConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY && !!process.env.STRIPE_PRICE_ID;
}

let _stripe: Stripe | null = null;
export function getStripe(): Stripe | null {
  if (!process.env.STRIPE_SECRET_KEY) return null;
  if (!_stripe) _stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  return _stripe;
}
