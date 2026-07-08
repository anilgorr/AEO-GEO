"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { callClaudeJSON, AgentUnavailableError } from "@/lib/anthropic";
import {
  PLANNING_AGENT_SYSTEM_PROMPT,
  KEYWORD_AGENT_SYSTEM_PROMPT,
  ONPAGE_AGENT_SYSTEM_PROMPT,
  AUDIT_AGENT_SYSTEM_PROMPT,
  SCHEMA_AGENT_SYSTEM_PROMPT,
  GEO_AGENT_SYSTEM_PROMPT,
  OFFPAGE_AGENT_SYSTEM_PROMPT,
  SITEMAP_AGENT_SYSTEM_PROMPT,
  MONITORING_AGENT_SYSTEM_PROMPT,
} from "@/lib/agent-prompts";
import type { PlanningAgentOutput, ProposedTask } from "@/lib/types";

export async function runPlanningAgent(clientId: string) {
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

  const { data: existingTasks } = await supabase
    .from("tasks")
    .select("title, type, status")
    .eq("client_id", clientId);

  const { data: runRow } = await supabase
    .from("agent_runs")
    .insert({
      agent_type: "planning",
      client_id: clientId,
      input: { client_name: client.name },
      status: "running",
      requested_by: user.id,
    })
    .select()
    .single();

  if (!runRow) throw new Error("Failed to create agent run");

  const userContent = JSON.stringify({
    client_name: client.name,
    industry: client.industry,
    website_url: client.website_url,
    engagement_type: client.engagement_type,
    onboarding_answers: client.onboarding_answers,
    existing_tasks: existingTasks ?? [],
  });

  try {
    const output = await callClaudeJSON<PlanningAgentOutput>(
      PLANNING_AGENT_SYSTEM_PROMPT,
      userContent
    );

    await supabase
      .from("agent_runs")
      .update({ status: "completed", output })
      .eq("id", runRow.id);

    revalidatePath("/plan-review");
    return { runId: runRow.id as string };
  } catch (err) {
    const message =
      err instanceof AgentUnavailableError
        ? err.message
        : err instanceof Error
          ? err.message
          : "Unknown error";
    await supabase
      .from("agent_runs")
      .update({ status: "failed", error: message })
      .eq("id", runRow.id);
    return { runId: runRow.id as string, error: message };
  }
}

export async function approvePlanningProposals(
  clientId: string,
  approvedTasks: ProposedTask[]
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  if (approvedTasks.length === 0) {
    revalidatePath("/");
    return { created: 0 };
  }

  const rows = approvedTasks.map((t) => ({
    client_id: clientId,
    title: t.title,
    description: t.description,
    type: t.type,
    priority: t.priority,
    reporter_id: user.id,
    content_stage: t.type === "content" ? "brief" : null,
  }));

  const { data: createdTasks, error } = await supabase
    .from("tasks")
    .insert(rows)
    .select();
  if (error) throw new Error(error.message);

  // Trigger specialist agents for any approved task that named one.
  // A given specialist may not be built yet (or may fail) — that should
  // never block the task itself from being created.
  for (let i = 0; i < approvedTasks.length; i++) {
    const targetAgent = approvedTasks[i].target_agent;
    const task = createdTasks?.[i];
    if (targetAgent && task) {
      await runSpecialistAgent(
        targetAgent,
        clientId,
        approvedTasks[i].description,
        task.id
      ).catch(() => null);
    }
  }

  revalidatePath("/");
  return { created: rows.length };
}

const SPECIALIST_PROMPTS: Partial<Record<string, string>> = {
  keyword: KEYWORD_AGENT_SYSTEM_PROMPT,
  onpage: ONPAGE_AGENT_SYSTEM_PROMPT,
  audit: AUDIT_AGENT_SYSTEM_PROMPT,
  schema: SCHEMA_AGENT_SYSTEM_PROMPT,
  geo: GEO_AGENT_SYSTEM_PROMPT,
  offpage: OFFPAGE_AGENT_SYSTEM_PROMPT,
  sitemap: SITEMAP_AGENT_SYSTEM_PROMPT,
};

export async function runSpecialistAgent(
  agentType: string,
  clientId: string,
  brief: string,
  taskId?: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const systemPrompt = SPECIALIST_PROMPTS[agentType];

  const { data: runRow } = await supabase
    .from("agent_runs")
    .insert({
      agent_type: agentType,
      client_id: clientId,
      task_id: taskId ?? null,
      input: { brief },
      status: "running",
      requested_by: user.id,
    })
    .select()
    .single();
  if (!runRow) throw new Error("Failed to create agent run");

  if (!systemPrompt) {
    const message = `Agent "${agentType}" isn't built yet.`;
    await supabase
      .from("agent_runs")
      .update({ status: "failed", error: message })
      .eq("id", runRow.id);
    return { runId: runRow.id as string, error: message };
  }

  const { data: client } = await supabase
    .from("clients")
    .select("name, website_url, industry")
    .eq("id", clientId)
    .single();

  const userContent = JSON.stringify({ client, brief });

  try {
    const output = await callClaudeJSON<Record<string, unknown>>(
      systemPrompt,
      userContent
    );
    await supabase
      .from("agent_runs")
      .update({ status: "completed", output })
      .eq("id", runRow.id);
    revalidatePath("/agents");
    return { runId: runRow.id as string, output };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await supabase
      .from("agent_runs")
      .update({ status: "failed", error: message })
      .eq("id", runRow.id);
    return { runId: runRow.id as string, error: message };
  }
}

export async function runMonitoringAgent(clientId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: client } = await supabase
    .from("clients")
    .select("name")
    .eq("id", clientId)
    .single();
  if (!client) throw new Error("Client not found");

  const { data: tasks } = await supabase
    .from("tasks")
    .select("status, due_date, content_stage")
    .eq("client_id", clientId);

  const today = new Date().toISOString().slice(0, 10);
  const statusCounts = { todo: 0, in_progress: 0, review: 0, done: 0 };
  let overdue = 0;
  let stalledContent = 0;
  for (const t of tasks ?? []) {
    statusCounts[t.status as keyof typeof statusCounts]++;
    if (t.due_date && t.due_date < today && t.status !== "done") overdue++;
    if (t.content_stage && t.content_stage !== "published") stalledContent++;
  }

  const { data: phrases } = await supabase
    .from("tracked_phrases")
    .select("id")
    .eq("client_id", clientId)
    .eq("locked", true);
  const phraseIds = (phrases ?? []).map((p) => p.id);

  let visibilitySummary: Record<string, unknown> = { has_data: false };
  if (phraseIds.length > 0) {
    const { data: checks } = await supabase
      .from("citation_checks")
      .select("platform, cited")
      .in("phrase_id", phraseIds);
    if (checks && checks.length > 0) {
      const cited = checks.filter((c) => c.cited).length;
      visibilitySummary = {
        has_data: true,
        overall_visibility_pct: Math.round((cited / checks.length) * 100),
        total_checks: checks.length,
      };
    }
  }

  const { data: runRow } = await supabase
    .from("agent_runs")
    .insert({
      agent_type: "monitoring",
      client_id: clientId,
      input: {},
      status: "running",
      requested_by: user.id,
    })
    .select()
    .single();
  if (!runRow) throw new Error("Failed to create agent run");

  const userContent = JSON.stringify({
    client_name: client.name,
    task_status_counts: statusCounts,
    overdue_tasks: overdue,
    stalled_content_approvals: stalledContent,
    visibility: visibilitySummary,
  });

  try {
    const output = await callClaudeJSON<Record<string, unknown>>(
      MONITORING_AGENT_SYSTEM_PROMPT,
      userContent
    );
    await supabase
      .from("agent_runs")
      .update({ status: "completed", output })
      .eq("id", runRow.id);
    revalidatePath("/monitoring");
    return { runId: runRow.id as string, output };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await supabase
      .from("agent_runs")
      .update({ status: "failed", error: message })
      .eq("id", runRow.id);
    return { runId: runRow.id as string, error: message };
  }
}

export async function createTaskFromSuggestion(
  clientId: string,
  title: string,
  description: string,
  type: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: task, error } = await supabase
    .from("tasks")
    .insert({
      client_id: clientId,
      title: title.slice(0, 200),
      description,
      type,
      priority: 3,
      reporter_id: user.id,
      content_stage: type === "content" ? "brief" : null,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);

  revalidatePath("/");
  return { taskId: task.id as string };
}

export async function updateAgentRunOutput(
  runId: string,
  editedOutput: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("agent_runs")
    .update({ edited_output: editedOutput.trim() || null })
    .eq("id", runId);
  if (error) throw new Error(error.message);

  revalidatePath("/outputs");
  revalidatePath("/");
}

export async function triggerOnboardingFlow(clientId: string) {
  const supabase = await createClient();
  const { data: templates } = await supabase
    .from("task_templates")
    .select("id")
    .limit(1);

  // Baseline templated plan (safe no-op if no templates seeded yet)
  if (templates && templates.length > 0) {
    const { generatePlanForClient } = await import("./tasks-actions");
    await generatePlanForClient(clientId).catch(() => null);
  }

  const { runId } = await runPlanningAgent(clientId);
  redirect(`/plan-review?client=${clientId}&run=${runId}`);
}
