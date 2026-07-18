import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { FREE_GENERATIONS, isStripeConfigured, getStripe } from "@/lib/stripe";

const DAY_MS = 24 * 60 * 60 * 1000;

export type Access = {
  subscribed: boolean;
  status: string; // Stripe subscription status, or "none"
  stripeCustomerId: string | null;
  // Usage-based free trial.
  freeLimit: number;
  generationsUsed: number;
  generationsLeft: number;
  trialActive: boolean; // still has free generations left
  canGenerate: boolean;
  // If Stripe isn't configured, we never hard-block generation (trial is just
  // informational) so the owner can keep using it while billing is being set up.
  billingEnforced: boolean;
};

// Access is computed for the currently signed-in teacher. The free trial is a
// fixed number of AI generations; paid status comes from the billing table.
export async function getAccess(): Promise<Access | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: billing } = await supabase
    .from("billing")
    .select("status, stripe_customer_id, current_period_end, trial_generations_used")
    .eq("user_id", user.id)
    .maybeSingle();

  const status = billing?.status ?? "none";
  // Treat the paid window as valid only if the period hasn't clearly passed
  // (1-day grace). A stale/expired period flips this false, which triggers a
  // reconcile in getAccessSynced() even when the webhook never fired.
  const periodOk =
    !billing?.current_period_end ||
    new Date(billing.current_period_end).getTime() > Date.now() - DAY_MS;
  const subscribed = (status === "active" || status === "trialing") && periodOk;
  const billingEnforced = isStripeConfigured();

  const generationsUsed = billing?.trial_generations_used ?? 0;
  const generationsLeft = Math.max(0, FREE_GENERATIONS - generationsUsed);
  const trialActive = generationsLeft > 0;

  return {
    subscribed,
    status,
    stripeCustomerId: billing?.stripe_customer_id ?? null,
    freeLimit: FREE_GENERATIONS,
    generationsUsed,
    generationsLeft,
    trialActive,
    billingEnforced,
    canGenerate: !billingEnforced || subscribed || trialActive,
  };
}

// Count one successful AI generation against the free trial. Only tracked when
// billing is enforced (otherwise the count is irrelevant). Serial per teacher,
// so a plain read-modify-write is fine.
export async function recordGeneration(): Promise<void> {
  if (!isStripeConfigured()) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const admin = createAdminClient();
  const { data } = await admin
    .from("billing")
    .select("trial_generations_used")
    .eq("user_id", user.id)
    .maybeSingle();

  const used = data?.trial_generations_used ?? 0;
  // upsert merges: only these columns change; status/customer stay intact.
  await admin
    .from("billing")
    .upsert({ user_id: user.id, trial_generations_used: used + 1 });
}

// getAccess, but if the teacher has a Stripe customer yet isn't showing active,
// pull the live status from Stripe once and recompute. Makes subscribe/cancel/
// pause reflect promptly even if the webhook is delayed or unconfigured.
export async function getAccessSynced(): Promise<Access | null> {
  let access = await getAccess();
  if (
    access?.billingEnforced &&
    !access.subscribed &&
    access.stripeCustomerId
  ) {
    await reconcileBilling();
    access = await getAccess();
  }
  return access;
}

// Pull the live subscription status from Stripe and write it to the billing
// table. A safety net so a subscription reflects immediately even if the
// webhook is delayed or not configured. Call it after checkout returns, and on
// the dashboard for anyone who has a Stripe customer but no active status yet.
export async function reconcileBilling(): Promise<void> {
  const stripe = getStripe();
  if (!stripe) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const admin = createAdminClient();
  const { data: billing } = await admin
    .from("billing")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .maybeSingle();

  let customerId = billing?.stripe_customer_id ?? null;
  if (!customerId && user.email) {
    const found = await stripe.customers.list({ email: user.email, limit: 1 });
    customerId = found.data[0]?.id ?? null;
  }
  if (!customerId) return;

  const subs = await stripe.subscriptions.list({
    customer: customerId,
    status: "all",
    limit: 1,
  });
  const sub = subs.data[0];
  const status = sub ? sub.status : "canceled";
  const periodEndRaw = sub
    ? (sub as unknown as { current_period_end?: number }).current_period_end
    : undefined;

  await admin.from("billing").upsert({
    user_id: user.id,
    stripe_customer_id: customerId,
    status,
    current_period_end: periodEndRaw
      ? new Date(periodEndRaw * 1000).toISOString()
      : null,
    updated_at: new Date().toISOString(),
  });
}
