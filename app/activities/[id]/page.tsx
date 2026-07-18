import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, Trash2, MonitorPlay } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getOrigin, buildJoinInfo } from "@/lib/join";
import { deleteActivity } from "../actions";
import { ShareLink } from "./ShareLink";
import { LiveData, type ResponseRow } from "./LiveData";

export const dynamic = "force-dynamic";

export default async function ActivityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: activity } = await supabase
    .from("activities")
    .select("id, title, collect_data, share_slug")
    .eq("id", id)
    .single();

  if (!activity) notFound();

  const origin = await getOrigin();
  const join = await buildJoinInfo(activity.share_slug, origin, 132);
  const joinHost = join.joinUrl.replace(/^https?:\/\//, "");

  const { data: responses } = activity.collect_data
    ? await supabase
        .from("responses")
        .select("id, student_name, structured_data, status, updated_at")
        .eq("activity_id", id)
        .order("updated_at", { ascending: false })
    : { data: [] as ResponseRow[] };

  return (
    <main className="min-h-screen">
      <header className="max-w-3xl mx-auto px-6 py-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink transition"
        >
          <ArrowLeft className="w-4 h-4" /> My activities
        </Link>
      </header>

      <div className="max-w-3xl mx-auto px-6 pb-16">
        <div className="flex items-start justify-between gap-4 mb-6">
          <h1 className="text-2xl font-semibold">{activity.title}</h1>
          <form action={deleteActivity}>
            <input type="hidden" name="id" value={activity.id} />
            <button
              className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-red-500 transition"
              title="Delete activity"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </form>
        </div>

        <div className="rounded-cozy border border-border bg-surface p-5 mb-6">
          <div className="flex flex-col sm:flex-row gap-5 sm:items-center">
            <div className="flex-1">
              <p className="text-sm text-muted mb-1">
                Students join at{" "}
                <span className="font-medium text-ink">{joinHost}</span> with code
              </p>
              <p className="font-mono font-bold tracking-[0.15em] text-3xl mb-3">
                {join.code}
              </p>
              <Link
                href={`/activities/${activity.id}/present`}
                target="_blank"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-cozy bg-accent text-accent-ink font-medium hover:opacity-90 transition text-sm"
              >
                <MonitorPlay className="w-4 h-4" /> Present to class
              </Link>
            </div>
            <div
              className="shrink-0 bg-white p-2 rounded-cozy border border-border self-start"
              dangerouslySetInnerHTML={{ __html: join.qrSvg }}
            />
          </div>
        </div>

        <div className="rounded-cozy border border-border bg-surface p-5 mb-8">
          <p className="text-sm text-muted mb-2">Or share a direct link</p>
          <ShareLink slug={activity.share_slug} />
          <a
            href={`/p/${activity.share_slug}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-accent mt-3 hover:underline"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Open the activity
          </a>
        </div>

        {activity.collect_data ? (
          <LiveData
            activityId={activity.id}
            initial={(responses ?? []) as ResponseRow[]}
          />
        ) : (
          <p className="text-sm text-muted">
            This activity is share-only — no student data is collected.
          </p>
        )}
      </div>
    </main>
  );
}
