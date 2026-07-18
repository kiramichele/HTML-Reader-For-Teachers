import { createClient } from "@/lib/supabase/server";
import { TRIAL_DAYS, isStripeConfigured } from "@/lib/stripe";

const DAY_MS = 24 * 60 * 60 * 1000;

export type Access = {
  trialActive: boolean;
  trialEndsAt: Date;
  daysLeft: number;
  subscribed: boolean;
  status: string; // Stripe subscription status, or "none"
  canGenerate: boolean;
  // If Stripe isn't configured, we never hard-block generation (trial is just
  // informational) so the owner can keep using it while billing is being set up.
  billingEnforced: boolean;
};

// Access is computed for the currently signed-in teacher. The 30-day trial is
// derived from their signup date; paid status comes from the billing table.
export async function getAccess(): Promise<Access | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const created = user.created_at ? new Date(user.created_at) : new Date();
  const trialEndsAt = new Date(created.getTime() + TRIAL_DAYS * DAY_MS);
  const now = Date.now();
  const trialActive = now < trialEndsAt.getTime();
  const daysLeft = Math.max(0, Math.ceil((trialEndsAt.getTime() - now) / DAY_MS));

  const { data: billing } = await supabase
    .from("billing")
    .select("status")
    .eq("user_id", user.id)
    .maybeSingle();

  const status = billing?.status ?? "none";
  const subscribed = status === "active" || status === "trialing";
  const billingEnforced = isStripeConfigured();

  return {
    trialActive,
    trialEndsAt,
    daysLeft,
    subscribed,
    status,
    billingEnforced,
    canGenerate: !billingEnforced || trialActive || subscribed,
  };
}
