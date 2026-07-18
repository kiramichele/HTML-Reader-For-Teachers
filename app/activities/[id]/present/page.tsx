import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getOrigin, buildJoinInfo } from "@/lib/join";

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
    .select("id, title, share_slug")
    .eq("id", id)
    .single();

  if (!activity) notFound();

  const origin = await getOrigin();
  const join = await buildJoinInfo(activity.share_slug, origin, 320);
  const joinHost = join.joinUrl.replace(/^https?:\/\//, "");

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

      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-16 text-center">
        <h1 className="text-2xl sm:text-3xl font-semibold text-muted mb-1">
          {activity.title}
        </h1>
        <p className="text-lg sm:text-xl text-muted mb-8">
          Join at{" "}
          <span className="font-semibold text-ink">{joinHost}</span>
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-8 sm:gap-14">
          <div>
            <p className="text-sm uppercase tracking-widest text-muted mb-2">
              Class code
            </p>
            <p className="font-mono font-bold tracking-[0.15em] text-5xl sm:text-7xl">
              {join.code}
            </p>
          </div>

          <div className="flex flex-col items-center">
            <div
              className="bg-white p-3 rounded-cozy border border-border"
              // Locally-generated QR SVG (no external service).
              dangerouslySetInnerHTML={{ __html: join.qrSvg }}
            />
            <p className="text-sm text-muted mt-2">Scan to join</p>
          </div>
        </div>
      </div>
    </main>
  );
}
