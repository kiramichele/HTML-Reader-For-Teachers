import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getOrigin, buildJoinInfo } from "@/lib/join";
import type { ResponseRow } from "../LiveData";
import { PresentScreen } from "./PresentScreen";

export const dynamic = "force-dynamic";

export default async function PresentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // RLS restricts this to the owner.
  const { data: activity } = await supabase
    .from("activities")
    .select("id, title, share_slug, collect_data")
    .eq("id", id)
    .single();

  if (!activity) notFound();

  const origin = await getOrigin();
  const join = await buildJoinInfo(activity.share_slug, origin, 320);
  const joinHost = join.joinUrl.replace(/^https?:\/\//, "");

  const { data: responses } = activity.collect_data
    ? await supabase
        .from("responses")
        .select("id, student_name, structured_data, status, updated_at")
        .eq("activity_id", id)
        .order("updated_at", { ascending: false })
    : { data: [] as ResponseRow[] };

  return (
    <main className="min-h-screen flex flex-col">
      <div className="px-6 py-4">
        <Link
          href={`/activities/${activity.id}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
      </div>

      <PresentScreen
        title={activity.title}
        code={join.code}
        joinHost={joinHost}
        qrSvg={join.qrSvg}
        activityId={activity.id}
        collectData={activity.collect_data}
        initialRows={(responses ?? []) as ResponseRow[]}
      />
    </main>
  );
}
