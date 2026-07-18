import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { Player } from "./Player";

const BUCKET = "activities";

// Always render fresh — the activity HTML is fetched at request time and can
// change (or be deleted). Prevents Vercel from serving a stale cached page.
export const dynamic = "force-dynamic";

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
    .select("id, title, storage_path, collect_data, share_slug, closed")
    .eq("share_slug", slug)
    .single();

  if (!activity) notFound();

  // Fetch the HTML server-side and render it via the iframe's srcDoc. The
  // browser parses srcDoc as HTML directly, so this never depends on the
  // stored file's content type. sandbox (no allow-same-origin) keeps the
  // activity in an opaque origin — it can't touch the app session.
  const { data: blob } = await admin.storage
    .from(BUCKET)
    .download(activity.storage_path);
  const html = blob ? await blob.text() : "";

  // Plain slideshow / no data collection — just show it full-bleed.
  if (!activity.collect_data) {
    return (
      <iframe
        srcDoc={html}
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
    <Player
      slug={activity.share_slug}
      html={html}
      title={activity.title}
      closed={activity.closed}
    />
  );
}
