import Link from "next/link";
import { ArrowRight, Upload, Link2, BarChart3 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="min-h-screen">
      <header className="max-w-5xl mx-auto px-6 py-6 flex items-center justify-between">
        <span className="font-semibold text-lg">📎 Share &amp; Collect</span>
        <Link
          href={user ? "/dashboard" : "/login"}
          className="text-sm px-4 py-2 rounded-cozy bg-accent text-accent-ink font-medium hover:opacity-90 transition"
        >
          {user ? "My activities" : "Sign in"}
        </Link>
      </header>

      <section className="max-w-3xl mx-auto px-6 pt-16 pb-10 text-center">
        <p className="text-sm font-mono uppercase tracking-widest text-accent mb-4">
          For teachers
        </p>
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight mb-5">
          Upload an HTML activity.
          <br />
          Get a link. Watch answers arrive.
        </h1>
        <p className="text-lg text-muted max-w-xl mx-auto mb-8">
          Made an interactive activity with Claude? Drop the HTML file here and
          send students a link. No downloads, no logins for students — they just
          type their name, and their work saves to your dashboard live.
        </p>
        <Link
          href={user ? "/activities/new" : "/login"}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-cozy bg-accent text-accent-ink font-medium hover:opacity-90 transition"
        >
          {user ? "Upload an activity" : "Get started — it's free"}
          <ArrowRight className="w-4 h-4" />
        </Link>
      </section>

      <section className="max-w-4xl mx-auto px-6 py-12 grid gap-6 sm:grid-cols-3">
        <Feature
          icon={<Upload className="w-6 h-6" />}
          title="1. Upload"
          body="Sign in and upload the HTML file you made. Choose whether to collect student answers or just share a slideshow."
        />
        <Feature
          icon={<Link2 className="w-6 h-6" />}
          title="2. Share a link"
          body="You get a clean link to post in Canvas or paste in chat. Students open it and type their name — that's it."
        />
        <Feature
          icon={<BarChart3 className="w-6 h-6" />}
          title="3. See the data"
          body="Open your dashboard to watch responses come in live, grouped by question as word walls."
        />
      </section>

      <footer className="max-w-4xl mx-auto px-6 py-12 text-center text-sm text-faint">
        Works with any activity that speaks the <code>stardrop:*</code> protocol.
      </footer>
    </main>
  );
}

function Feature({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-cozy border border-border bg-surface p-5">
      <div className="text-accent mb-3">{icon}</div>
      <h3 className="font-semibold mb-1.5">{title}</h3>
      <p className="text-sm text-muted">{body}</p>
    </div>
  );
}
