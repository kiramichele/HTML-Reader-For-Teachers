import Link from "next/link";
import { Plus, FileText, Database, LogOut, Sparkles, CreditCard } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/login/actions";
import { getAccessSynced } from "@/lib/billing";
import { openPortal, startCheckout } from "@/app/billing/actions";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const access = await getAccessSynced();

  const { data: activities } = await supabase
    .from("activities")
    .select("id, title, collect_data, created_at")
    .order("created_at", { ascending: false });

  return (
    <main className="min-h-screen">
      <header className="max-w-3xl mx-auto px-6 py-6 flex items-center justify-between">
        <Link href="/" className="font-semibold text-lg">
          📎 Share &amp; Collect
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-muted hidden sm:inline">{user?.email}</span>
          <form action={signOut}>
            <button className="inline-flex items-center gap-1.5 text-muted hover:text-ink transition">
              <LogOut className="w-4 h-4" /> Sign out
            </button>
          </form>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-6">
        {access?.billingEnforced && (
          <div className="rounded-cozy border border-border bg-surface px-4 py-3 mb-6 flex items-center justify-between gap-3 flex-wrap text-sm">
            {access.subscribed ? (
              <span className="inline-flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-sage" /> Subscribed — AI
                generation active.
              </span>
            ) : access.trialActive ? (
              <span className="inline-flex items-center gap-2 text-muted">
                <CreditCard className="w-4 h-4 text-accent" /> Free trial:{" "}
                <strong className="text-ink">{access.daysLeft}</strong>{" "}
                {access.daysLeft === 1 ? "day" : "days"} of AI generation left.
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 text-muted">
                <CreditCard className="w-4 h-4 text-accent" /> Trial ended —
                subscribe to keep generating with Claude.
              </span>
            )}
            {access.subscribed ? (
              <form action={openPortal}>
                <button className="text-accent hover:underline">
                  Manage / pause / cancel
                </button>
              </form>
            ) : (
              <form action={startCheckout}>
                <button className="px-3 py-1.5 rounded-cozy bg-accent text-accent-ink font-medium hover:opacity-90 transition">
                  Subscribe · $10/mo
                </button>
              </form>
            )}
          </div>
        )}

        <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
          <h1 className="text-2xl font-semibold">My activities</h1>
          <div className="flex items-center gap-2">
            <Link
              href="/activities/generate"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-cozy bg-accent text-accent-ink font-medium hover:opacity-90 transition text-sm"
            >
              <Sparkles className="w-4 h-4" /> Generate with Claude
            </Link>
            <Link
              href="/activities/new"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-cozy border border-border bg-surface hover:border-accent transition text-sm"
            >
              <Plus className="w-4 h-4" /> Upload
            </Link>
          </div>
        </div>

        {!activities || activities.length === 0 ? (
          <div className="rounded-cozy border border-dashed border-border p-12 text-center">
            <FileText className="w-8 h-8 text-faint mx-auto mb-3" />
            <p className="text-muted mb-4">No activities yet.</p>
            <div className="flex items-center justify-center gap-2">
              <Link
                href="/activities/generate"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-cozy bg-accent text-accent-ink font-medium hover:opacity-90 transition text-sm"
              >
                <Sparkles className="w-4 h-4" /> Generate with Claude
              </Link>
              <Link
                href="/activities/new"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-cozy border border-border bg-surface hover:border-accent transition text-sm"
              >
                <Plus className="w-4 h-4" /> Upload
              </Link>
            </div>
          </div>
        ) : (
          <ul className="space-y-3">
            {activities.map((a) => (
              <li key={a.id}>
                <Link
                  href={`/activities/${a.id}`}
                  className="flex items-center justify-between gap-4 p-4 rounded-cozy border border-border bg-surface hover:border-accent transition"
                >
                  <span className="min-w-0">
                    <span className="block font-medium truncate">
                      {a.title}
                    </span>
                    <span className="text-xs text-faint">
                      {new Date(a.created_at).toLocaleDateString()}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs inline-flex items-center gap-1.5 text-muted">
                    {a.collect_data ? (
                      <>
                        <Database className="w-3.5 h-3.5" /> Collecting data
                      </>
                    ) : (
                      <>
                        <FileText className="w-3.5 h-3.5" /> Share only
                      </>
                    )}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
