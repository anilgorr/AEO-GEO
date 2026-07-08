"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { callClaudeJSON, AgentUnavailableError } from "@/lib/anthropic";
import {
  PLANNING_AGENT_SYSTEM_PROMPT,
  KEYWORD_AGENT_SYSTEM_PROMPT,
  ONPAGE_AGENT_SYSTEM_PROMPT,
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
