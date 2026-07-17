"use server";

import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/types/database";

// Students have no login. These actions run with the service-role key and are
// the ONLY way student data is written, so validate strictly and keep the
// surface tiny: look the activity up by its public slug, then upsert.

const nameSchema = z.string().trim().min(1).max(80);

const saveSchema = z.object({
  slug: z.string().trim().min(1).max(40),
  studentName: nameSchema,
  status: z.enum(["draft", "complete"]),
  // cap payload size to keep this endpoint from being abused as blob storage
  data: z.string().max(200_000),
});

async function activityBySlug(slug: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("activities")
    .select("id, collect_data")
    .eq("share_slug", slug)
    .single();
  return data;
}

export async function saveResponse(input: {
  slug: string;
  studentName: string;
  status: "draft" | "complete";
  data: Json | null;
}): Promise<{ ok: boolean; error?: string }> {
  const parsed = saveSchema.safeParse({
    slug: input.slug,
    studentName: input.studentName,
    status: input.status,
    data: JSON.stringify(input.data ?? null),
  });
  if (!parsed.success) return { ok: false, error: "Invalid submission" };

  const activity = await activityBySlug(parsed.data.slug);
  if (!activity) return { ok: false, error: "Activity not found" };
  if (!activity.collect_data) return { ok: true }; // data collection is off — no-op

  const admin = createAdminClient();
  const { error } = await admin.from("responses").upsert(
    {
      activity_id: activity.id,
      student_name: parsed.data.studentName,
      structured_data: input.data ?? null,
      status: parsed.data.status,
    },
    { onConflict: "activity_id,student_name" }
  );
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

// Restore a returning student's previous answers so they can pick up / edit.
export async function loadResponse(input: {
  slug: string;
  studentName: string;
}): Promise<{ data: Json | null }> {
  const parsedName = nameSchema.safeParse(input.studentName);
  if (!parsedName.success) return { data: null };

  const activity = await activityBySlug(input.slug);
  if (!activity) return { data: null };

  const admin = createAdminClient();
  const { data } = await admin
    .from("responses")
    .select("structured_data")
    .eq("activity_id", activity.id)
    .eq("student_name", parsedName.data)
    .maybeSingle();

  return { data: data?.structured_data ?? null };
}
