"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ContentStage, TaskStatus, TaskType } from "@/lib/types";

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
  const type = formData.get("type") as TaskType;

  const { error } = await supabase.from("tasks").insert({
    client_id: formData.get("client_id") || null,
    title: formData.get("title"),
    description: formData.get("description") || null,
    type,
    target_url: targetUrl || null,
    target_keyword: (formData.get("target_keyword") as string) || null,
    target_platform: (formData.get("target_platform") as string) || null,
    priority: Number(formData.get("priority")) || 3,
    assignee_id: formData.get("assignee_id") || null,
    reporter_id: user.id,
    due_date: (formData.get("due_date") as string) || null,
    risk_tier: riskTier,
    approval_state: riskTier === "high_impact" ? "pending" : "not_required",
    content_stage: type === "content" ? "brief" : null,
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

export async function updateContentStage(taskId: string, stage: ContentStage) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("tasks")
    .update({ content_stage: stage })
    .eq("id", taskId);

  if (error) throw new Error(error.message);

  await supabase.from("activity_log").insert({
    task_id: taskId,
    actor_id: user.id,
    action: "content_stage_changed",
    note: `Content stage changed to ${stage}`,
  });

  revalidatePath("/");
}

export async function createClientRecord(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const onboardingAnswers = {
    geography: formData.get("geography") || null,
    primary_goal: formData.get("primary_goal") || null,
    platform_priority: formData.getAll("platform_priority"),
    competitors: (formData.get("competitors") as string) || null,
    has_press_coverage: formData.get("has_press_coverage") === "true",
    has_smes_for_eeat: formData.get("has_smes_for_eeat") === "true",
    notes: (formData.get("notes") as string) || null,
  };

  const { data: newClient, error } = await supabase
    .from("clients")
    .insert({
      name: formData.get("name"),
      website_url: (formData.get("website_url") as string) || null,
      industry: (formData.get("industry") as string) || null,
      created_by: user.id,
      onboarding_answers: onboardingAnswers,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/");
  return { clientId: newClient.id as string };
}

export async function generatePlanForClient(clientId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("id", clientId)
    .single();
  if (!client) throw new Error("Client not found");

  const { data: templates } = await supabase
    .from("task_templates")
    .select("*");
  if (!templates || templates.length === 0) {
    throw new Error("No task templates found. Run the seed migration first.");
  }

  const { data: existingTasks } = await supabase
    .from("tasks")
    .select("template_id")
    .eq("client_id", clientId)
    .not("template_id", "is", null);
  const existingTemplateIds = new Set(
    (existingTasks ?? []).map((t) => t.template_id)
  );

  const hasPressCoverage = Boolean(
    client.onboarding_answers?.has_press_coverage
  );

  const templatesToCreate = templates.filter((template) => {
    if (existingTemplateIds.has(template.id)) return false;
    const isWikipediaTemplate = template.title
      .toLowerCase()
      .includes("wikipedia");
    if (isWikipediaTemplate && !hasPressCoverage) return false;
    return true;
  });

  if (templatesToCreate.length === 0) {
    return { created: 0 };
  }

  const rows = templatesToCreate.map((template) => ({
    client_id: clientId,
    template_id: template.id,
    title: template.title,
    description: template.description,
    type: template.default_type,
    risk_tier: template.default_risk_tier,
    approval_state:
      template.default_risk_tier === "high_impact"
        ? "pending"
        : "not_required",
    priority: 3,
    reporter_id: user.id,
    content_stage: template.default_type === "content" ? "brief" : null,
  }));

  const { error: insertError } = await supabase.from("tasks").insert(rows);
  if (insertError) throw new Error(insertError.message);

  revalidatePath("/");
  return { created: rows.length };
}
