import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

// Stripe posts subscription lifecycle events here. We verify the signature and
// mirror the subscription status into the billing table (service-role write).
export async function POST(req: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) {
    return new Response("Billing not configured", { status: 500 });
  }

  const sig = req.headers.get("stripe-signature");
  if (!sig) return new Response("Missing signature", { status: 400 });

  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  const admin = createAdminClient();

  const periodEndOf = (sub: Stripe.Subscription): string | null => {
    // current_period_end moved around across Stripe API versions — read it
    // defensively so this compiles regardless of the pinned SDK types.
    const raw = (sub as unknown as { current_period_end?: number })
      .current_period_end;
    return raw ? new Date(raw * 1000).toISOString() : null;
  };

  async function syncByCustomer(
    customerId: string,
    status: string,
    periodEnd: string | null
  ) {
    await admin
      .from("billing")
      .update({
        status,
        current_period_end: periodEnd,
        updated_at: new Date().toISOString(),
      })
      .eq("stripe_customer_id", customerId);
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const s = event.data.object as Stripe.Checkout.Session;
      const userId = s.client_reference_id;
      const customerId =
        typeof s.customer === "string" ? s.customer : s.customer?.id;
      if (userId && customerId) {
        await admin.from("billing").upsert({
          user_id: userId,
          stripe_customer_id: customerId,
          status: "active",
          updated_at: new Date().toISOString(),
        });
      }
      break;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const customerId =
        typeof sub.customer === "string" ? sub.customer : sub.customer.id;
      await syncByCustomer(customerId, sub.status, periodEndOf(sub));
      break;
    }
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const customerId =
        typeof sub.customer === "string" ? sub.customer : sub.customer.id;
      await syncByCustomer(customerId, "canceled", periodEndOf(sub));
      break;
    }
    case "invoice.payment_failed": {
      const inv = event.data.object as Stripe.Invoice;
      const customerId =
        typeof inv.customer === "string" ? inv.customer : inv.customer?.id;
      if (customerId) await syncByCustomer(customerId, "past_due", null);
      break;
    }
  }

  return new Response("ok", { status: 200 });
}
