"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { TaskStatus } from "@/lib/types";

const HIGH_IMPACT_KEYWORDS = ["pricing", "checkout", "production"];

export async function createTask(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const targetUrl = (formData.get("target_url") as string) || "";
  const riskTier = HIGH_IMPACT_KEYWORDS.some((k) => targetUrl.includes(k))
    ? "high_impact"
    : "routine";

  const { error } = await supabase.from("tasks").insert({
    client_id: formData.get("client_id") || null,
    title: formData.get("title"),
    description: formData.get("description") || null,
    type: formData.get("type"),
    target_url: targetUrl || null,
    target_keyword: (formData.get("target_keyword") as string) || null,
    target_platform: (formData.get("target_platform") as string) || null,
    priority: Number(formData.get("priority")) || 3,
    assignee_id: formData.get("assignee_id") || null,
    reporter_id: user.id,
    due_date: (formData.get("due_date") as string) || null,
    risk_tier: riskTier,
    approval_state: riskTier === "high_impact" ? "pending" : "not_required",
  });

  if (error) throw new Error(error.message);

  revalidatePath("/");
}

export async function updateTaskStatus(taskId: string, status: TaskStatus) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("tasks")
    .update({ status })
    .eq("id", taskId);

  if (error) throw new Error(error.message);

  await supabase.from("activity_log").insert({
    task_id: taskId,
    actor_id: user.id,
    action: "status_changed",
    note: `Status changed to ${status}`,
  });

  revalidatePath("/");
}

export async function createClientRecord(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("clients").insert({
    name: formData.get("name"),
    website_url: (formData.get("website_url") as string) || null,
    industry: (formData.get("industry") as string) || null,
    created_by: user.id,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/");
}
