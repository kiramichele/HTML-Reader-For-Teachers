"use server";

import { randomUUID } from "crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { makeSlug } from "@/lib/slug";

const BUCKET = "activities";

const createSchema = z.object({
  title: z.string().trim().min(1, "Give it a title").max(200),
  collect_data: z.enum(["yes", "no"]),
});

export type CreateState = { error: string | null };

export async function createActivity(
  _prev: CreateState,
  formData: FormData
): Promise<CreateState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const parsed = createSchema.safeParse({
    title: formData.get("title"),
    collect_data: formData.get("collect_data"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose an HTML file to upload" };
  }
  if (file.size > 20 * 1024 * 1024) {
    return { error: "That file is larger than 20 MB" };
  }
  const name = file.name.toLowerCase();
  if (!name.endsWith(".html") && !name.endsWith(".htm")) {
    return { error: "Please upload an .html file" };
  }

  const html = await file.text();
  const id = randomUUID();
  const storagePath = `${user.id}/${id}.html`;

  // Upload with the service-role client so we don't depend on storage RLS.
  const admin = createAdminClient();
  const { error: uploadErr } = await admin.storage
    .from(BUCKET)
    .upload(storagePath, html, {
      contentType: "text/html; charset=utf-8",
      upsert: true,
    });
  if (uploadErr) return { error: `Upload failed: ${uploadErr.message}` };

  // Insert the row as the authed teacher so RLS enforces ownership.
  const { error: insertErr } = await supabase.from("activities").insert({
    id,
    teacher_id: user.id,
    title: parsed.data.title,
    storage_path: storagePath,
    collect_data: parsed.data.collect_data === "yes",
    share_slug: makeSlug(),
  });
  if (insertErr) {
    // best-effort cleanup so we don't orphan the file
    await admin.storage.from(BUCKET).remove([storagePath]);
    return { error: `Couldn't save activity: ${insertErr.message}` };
  }

  revalidatePath("/dashboard");
  redirect(`/activities/${id}`);
}

export async function deleteActivity(formData: FormData) {
  const id = formData.get("id");
  if (typeof id !== "string") return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  // Fetch to confirm ownership + get the storage path (RLS restricts to owner).
  const { data: activity } = await supabase
    .from("activities")
    .select("id, storage_path")
    .eq("id", id)
    .single();
  if (!activity) return;

  await supabase.from("activities").delete().eq("id", id);

  const admin = createAdminClient();
  await admin.storage.from(BUCKET).remove([activity.storage_path]);

  revalidatePath("/dashboard");
  redirect("/dashboard");
}
