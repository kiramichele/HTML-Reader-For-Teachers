"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";
import { getOrigin } from "@/lib/join";

// Start a Stripe Checkout for the $10/month subscription and redirect to it.
export async function startCheckout() {
  const stripe = getStripe();
  if (!stripe || !process.env.STRIPE_PRICE_ID) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();
  const { data: billing } = await admin
    .from("billing")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .maybeSingle();

  let customerId = billing?.stripe_customer_id ?? undefined;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email ?? undefined,
      metadata: { user_id: user.id },
    });
    customerId = customer.id;
    await admin
      .from("billing")
      .upsert({ user_id: user.id, stripe_customer_id: customerId });
  }

  const origin = await getOrigin();
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
    client_reference_id: user.id,
    subscription_data: { metadata: { user_id: user.id } },
    allow_promotion_codes: true,
    success_url: `${origin}/activities/generate?subscribed=1`,
    cancel_url: `${origin}/activities/generate?canceled=1`,
  });

  if (session.url) redirect(session.url);
}

// Open the Stripe customer portal so teachers can update/cancel their plan.
export async function openPortal() {
  const stripe = getStripe();
  if (!stripe) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();
  const { data: billing } = await admin
    .from("billing")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!billing?.stripe_customer_id) redirect("/dashboard");

  const origin = await getOrigin();
  const session = await stripe.billingPortal.sessions.create({
    customer: billing.stripe_customer_id,
    return_url: `${origin}/dashboard`,
  });
  redirect(session.url);
}
