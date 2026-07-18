"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";

export type JoinState = { error: string | null };

export async function joinByCode(
  _prev: JoinState,
  formData: FormData
): Promise<JoinState> {
  const raw = String(formData.get("code") ?? "");
  // Forgiving: ignore case, spaces, and stray punctuation.
  const code = raw.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  if (!code) return { error: "Enter your class code" };

  const admin = createAdminClient();
  const { data } = await admin
    .from("activities")
    .select("share_slug")
    .eq("share_slug", code)
    .single();

  if (!data) {
    return { error: "No activity with that code — double-check and try again." };
  }

  redirect(`/p/${data.share_slug}`);
}
