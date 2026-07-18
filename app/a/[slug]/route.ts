import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET = "activities";

// Serves an activity's stored HTML with an explicit text/html content type, so
// it always renders (Supabase Storage can serve uploads as text/plain, which
// makes the browser show source). A CSP `sandbox` header keeps the activity
// isolated from the app session — it runs in an opaque origin whether embedded
// in the player iframe or opened directly, so its script can't read our cookies.
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ slug: string }> }
) {
  const { slug } = await ctx.params;

  const admin = createAdminClient();
  const { data: activity } = await admin
    .from("activities")
    .select("storage_path")
    .eq("share_slug", slug)
    .single();

  if (!activity) {
    return new Response("Not found", { status: 404 });
  }

  const { data: blob, error } = await admin.storage
    .from(BUCKET)
    .download(activity.storage_path);

  if (error || !blob) {
    return new Response("Not found", { status: 404 });
  }

  const html = await blob.text();

  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      // Sandbox the document itself (covers direct navigation, not just iframes).
      "Content-Security-Policy":
        "sandbox allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox;",
      "Cache-Control": "public, max-age=60",
    },
  });
}
