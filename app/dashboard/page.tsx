import Link from "next/link";
import { Plus, FileText, Database, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/login/actions";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">My activities</h1>
          <Link
            href="/activities/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-cozy bg-accent text-accent-ink font-medium hover:opacity-90 transition text-sm"
          >
            <Plus className="w-4 h-4" /> New activity
          </Link>
        </div>

        {!activities || activities.length === 0 ? (
          <div className="rounded-cozy border border-dashed border-border p-12 text-center">
            <FileText className="w-8 h-8 text-faint mx-auto mb-3" />
            <p className="text-muted mb-4">No activities yet.</p>
            <Link
              href="/activities/new"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-cozy bg-accent text-accent-ink font-medium hover:opacity-90 transition text-sm"
            >
              <Plus className="w-4 h-4" /> Upload your first one
            </Link>
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
