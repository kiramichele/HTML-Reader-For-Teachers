import Link from "next/link";
import { ArrowLeft, Upload, Sparkles, Clock, Check } from "lucide-react";
import { isAnthropicConfigured } from "@/lib/anthropic";
import { getAccessSynced } from "@/lib/billing";
import { PRICE_LABEL, FREE_GENERATIONS } from "@/lib/stripe";
import { startCheckout } from "@/app/billing/actions";
import { GenerateForm } from "./GenerateForm";

// Read env (Anthropic/Stripe) + per-request access at request time.
export const dynamic = "force-dynamic";

export default async function GeneratePage({
  searchParams,
}: {
  searchParams: Promise<{ subscribed?: string; canceled?: string }>;
}) {
  const configured = isAnthropicConfigured();
  const { subscribed: justSubscribed } = await searchParams;

  // getAccessSynced reconciles with Stripe when needed, so returning from
  // Checkout reflects immediately without waiting on the webhook.
  const access = await getAccessSynced();

  return (
    <main className="min-h-screen">
      <header className="max-w-2xl mx-auto px-6 py-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink transition"
        >
          <ArrowLeft className="w-4 h-4" /> My activities
        </Link>
      </header>
      <div className="max-w-2xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-semibold mb-1">Generate with Claude</h1>
        <p className="text-muted text-sm mb-6">
          Describe the activity in plain English. Claude builds it and wires up
          any data collection for you — no HTML needed.
        </p>

        {justSubscribed && (
          <div className="rounded-cozy border border-sage/40 bg-sage/10 p-3 text-sm mb-4 inline-flex items-center gap-2">
            <Check className="w-4 h-4 text-sage" /> You&apos;re subscribed —
            thanks! Generate away.
          </div>
        )}

        {!configured ? (
          <div className="rounded-cozy border border-border bg-surface p-6 text-sm">
            <p className="mb-3">
              AI generation isn&apos;t set up yet. Add{" "}
              <code>ANTHROPIC_API_KEY</code> to your <code>.env.local</code> and
              restart the server.
            </p>
            <Link
              href="/activities/new"
              className="inline-flex items-center gap-1.5 text-accent hover:underline"
            >
              <Upload className="w-4 h-4" /> Upload an HTML file instead
            </Link>
          </div>
        ) : access && access.canGenerate ? (
          <>
            {access.billingEnforced && !access.subscribed && (
              <div className="rounded-cozy border border-accent/30 bg-accent/5 p-3 text-sm mb-5 inline-flex items-center gap-2">
                <Clock className="w-4 h-4 text-accent" />
                Free trial — <strong>{access.generationsLeft}</strong> of{" "}
                {access.freeLimit} AI generations left.
              </div>
            )}
            <GenerateForm />
          </>
        ) : (
          <Paywall />
        )}
      </div>
    </main>
  );
}

function Paywall() {
  return (
    <div className="rounded-cozy border border-border bg-surface p-6">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-5 h-5 text-accent" />
        <h2 className="font-semibold">
          You&apos;ve used your {FREE_GENERATIONS} free generations
        </h2>
      </div>
      <p className="text-sm text-muted mb-4">
        Generating activities runs Anthropic&apos;s Claude API, which isn&apos;t
        free — so after your {FREE_GENERATIONS} free generations, AI generation
        is <strong>{PRICE_LABEL}</strong>. Everything else stays free: uploading
        your own HTML, sharing, join codes, and collecting student data.
      </p>
      <form action={startCheckout}>
        <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-cozy bg-accent text-accent-ink font-medium hover:opacity-90 transition">
          <Sparkles className="w-4 h-4" /> Subscribe — {PRICE_LABEL}
        </button>
      </form>
      <p className="text-xs text-faint mt-3">
        Cancel anytime. Or{" "}
        <Link href="/activities/new" className="text-accent hover:underline">
          upload an HTML file
        </Link>{" "}
        for free instead.
      </p>
    </div>
  );
}
