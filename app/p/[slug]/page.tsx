import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { Player } from "./Player";

export default async function PlayerPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Public page: look the activity up with the service-role client (RLS would
  // otherwise hide other teachers' activities from an anonymous visitor).
  const admin = createAdminClient();
  const { data: activity } = await admin
    .from("activities")
    .select("id, title, collect_data, share_slug")
    .eq("share_slug", slug)
    .single();

  if (!activity) notFound();

  // Served from our own route with an explicit text/html content type + a CSP
  // sandbox header (see app/a/[slug]/route.ts), so no allow-same-origin needed.
  const htmlUrl = `/a/${activity.share_slug}`;

  // Plain slideshow / no data collection — just show it full-bleed.
  if (!activity.collect_data) {
    return (
      <iframe
        src={htmlUrl}
        sandbox="allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
        title={activity.title}
        style={{
          position: "fixed",
          inset: 0,
          width: "100%",
          height: "100%",
          border: 0,
        }}
      />
    );
  }

  return (
    <Player slug={activity.share_slug} htmlUrl={htmlUrl} title={activity.title} />
  );
}
