"use server";

import { randomUUID } from "crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { makeSlug } from "@/lib/slug";
import { generateActivity, type GeneratedActivity } from "@/lib/anthropic";

const BUCKET = "activities";

// Shared: store an HTML string + create the activity row. Returns the new id.
async function persistHtmlActivity(opts: {
  userId: string;
  title: string;
  html: string;
  collectData: boolean;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const supabase = await createClient();
  const admin = createAdminClient();

  const id = randomUUID();
  const storagePath = `${opts.userId}/${id}.html`;

  const { error: uploadErr } = await admin.storage
    .from(BUCKET)
    .upload(storagePath, opts.html, {
      contentType: "text/html; charset=utf-8",
      upsert: true,
    });
  if (uploadErr) return { ok: false, error: `Upload failed: ${uploadErr.message}` };

  const { error: insertErr } = await supabase.from("activities").insert({
    id,
    teacher_id: opts.userId,
    title: opts.title,
    storage_path: storagePath,
    collect_data: opts.collectData,
    share_slug: makeSlug(),
  });
  if (insertErr) {
    await admin.storage.from(BUCKET).remove([storagePath]);
    return { ok: false, error: `Couldn't save activity: ${insertErr.message}` };
  }

  return { ok: true, id };
}

// ---------------------------------------------------------------------
// Upload flow
// ---------------------------------------------------------------------

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
  const result = await persistHtmlActivity({
    userId: user.id,
    title: parsed.data.title,
    html,
    collectData: parsed.data.collect_data === "yes",
  });
  if (!result.ok) return { error: result.error };

  revalidatePath("/dashboard");
  redirect(`/activities/${result.id}`);
}

// ---------------------------------------------------------------------
// AI generation flow (upload-first parity: same storage/player pipeline)
// ---------------------------------------------------------------------

export type GenerateState =
  | { status: "idle" }
  | { status: "error"; error: string }
  | { status: "ready"; activity: GeneratedActivity; prompt: string };

const promptSchema = z.string().trim().min(4, "Describe your activity").max(4000);

export async function generateActivityDraft(
  _prev: GenerateState,
  formData: FormData
): Promise<GenerateState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "error", error: "Not signed in" };

  const parsed = promptSchema.safeParse(formData.get("prompt"));
  if (!parsed.success) {
    return { status: "error", error: parsed.error.issues[0]?.message ?? "Invalid prompt" };
  }

  const result = await generateActivity(parsed.data);
  if (!result.ok) return { status: "error", error: result.error };

  return { status: "ready", activity: result.activity, prompt: parsed.data };
}

const saveSchema = z.object({
  title: z.string().trim().min(1).max(200),
  html: z.string().min(1).max(1_000_000),
  collectData: z.boolean(),
});

export async function saveGeneratedActivity(input: {
  title: string;
  html: string;
  collectData: boolean;
}): Promise<{ ok: boolean; id?: string; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in" };

  const parsed = saveSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid activity" };

  const result = await persistHtmlActivity({
    userId: user.id,
    title: parsed.data.title,
    html: parsed.data.html,
    collectData: parsed.data.collectData,
  });
  if (!result.ok) return { ok: false, error: result.error };

  revalidatePath("/dashboard");
  return { ok: true, id: result.id };
}

// ---------------------------------------------------------------------
// Delete
// ---------------------------------------------------------------------

export async function deleteActivity(formData: FormData) {
  const id = formData.get("id");
  if (typeof id !== "string") return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

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
