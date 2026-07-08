"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { updateTaskStatus } from "@/app/(dashboard)/tasks-actions";
import { runSpecialistAgent } from "@/app/(dashboard)/agent-actions";
import { AgentOutputView } from "@/components/agent-output-view";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AGENT_LABELS,
  type AgentType,
  type Task,
  type TaskType,
} from "@/lib/types";

const PHASE_LABELS: Record<string, string> = {
  "0_onboarding": "Phase 0 — Onboarding & Baseline Audit",
  "1_discovery": "Phase 1 — Entity & Topic Discovery",
  "2_clustering": "Phase 2 — Clustering & Prioritization",
  "3_onpage": "Phase 3 — On-Page for AI Extractability",
  "4_offpage": "Phase 4 — Off-Page & Brand Entity Building",
  "5_technical": "Phase 5 — Technical AI Accessibility",
  recurring: "Recurring — Ongoing Monitoring",
  custom: "Custom & Agent-Proposed Tasks",
};

const PHASE_ORDER = [
  "0_onboarding",
  "1_discovery",
  "2_clustering",
  "3_onpage",
  "4_offpage",
  "5_technical",
  "recurring",
  "custom",
];

const TYPE_DOT: Record<string, string> = {
  seo: "bg-blue-600",
  aeo: "bg-violet-600",
  geo: "bg-fuchsia-600",
  content: "bg-amber-500",
  technical: "bg-slate-500",
  off_page: "bg-emerald-600",
};

const CALLABLE_AGENTS: AgentType[] = [
  "keyword",
  "onpage",
  "audit",
  "schema",
  "geo",
  "offpage",
  "sitemap",
];

// Sensible default specialist per task type; user can override inline.
const DEFAULT_AGENT_BY_TYPE: Record<TaskType, AgentType> = {
  seo: "keyword",
  aeo: "onpage",
  geo: "geo",
  content: "onpage",
  technical: "audit",
  off_page: "offpage",
};

export interface TaskRun {
  id: string;
  agent_type: AgentType;
  status: string;
  output: Record<string, unknown> | null;
  edited_output: string | null;
  error: string | null;
  created_at: string;
}

export interface PhasedTask extends Task {
  template?: { phase: string } | null;
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`size-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-90" : ""}`}
    >
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function MetaChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
      {children}
    </span>
  );
}

function TaskRow({ task, runs }: { task: PhasedTask; runs: TaskRun[] }) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [agentType, setAgentType] = useState<AgentType>(
    DEFAULT_AGENT_BY_TYPE[task.type]
  );
  const [runError, setRunError] = useState<string | null>(null);
  const done = task.status === "done";
  const completedRuns = runs.filter((r) => r.status === "completed").length;

  return (
    <div className="border-b border-border last:border-b-0">
      {/* Collapsed header row — click anywhere to expand */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setExpanded((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setExpanded((v) => !v);
          }
        }}
        className="flex cursor-pointer items-center gap-3 px-4 py-3 hover:bg-muted/30"
      >
        <span onClick={(e) => e.stopPropagation()} className="flex items-center">
          <input
            type="checkbox"
            checked={done}
            disabled={isPending}
            onChange={(e) =>
              startTransition(() =>
                updateTaskStatus(task.id, e.target.checked ? "done" : "todo")
              )
            }
            className="size-4 cursor-pointer accent-primary"
            title={done ? "Mark as to do" : "Mark as done"}
          />
        </span>
        <span
          className={`size-2 shrink-0 rounded-full ${TYPE_DOT[task.type] ?? "bg-slate-400"}`}
          title={task.type}
        />
        <div className="min-w-0 flex-1">
          <p
            className={`truncate text-sm font-medium ${done ? "text-muted-foreground line-through" : ""}`}
          >
            {task.title}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {task.type.toUpperCase()}
            {task.due_date ? ` · due ${task.due_date}` : ""}
            {task.risk_tier === "high_impact" ? " · HIGH IMPACT" : ""}
          </p>
        </div>
        {completedRuns > 0 && (
          <Badge variant="secondary" className="shrink-0 rounded-full text-xs">
            {completedRuns} output{completedRuns === 1 ? "" : "s"}
          </Badge>
        )}
        <ChevronIcon open={expanded} />
      </div>

      {/* Expanded detail panel */}
      {expanded && (
        <div className="space-y-5 border-t border-border bg-muted/20 px-5 py-4">
          {task.description && (
            <p className="text-sm leading-relaxed text-muted-foreground">
              {task.description}
            </p>
          )}

          <div className="flex flex-wrap gap-1.5">
            <MetaChip>{task.type.toUpperCase()}</MetaChip>
            <MetaChip>Priority {task.priority}</MetaChip>
            {task.due_date && <MetaChip>Due {task.due_date}</MetaChip>}
            {task.risk_tier === "high_impact" && (
              <MetaChip>High impact — needs approval</MetaChip>
            )}
            {task.content_stage && (
              <MetaChip>
                Content stage: {task.content_stage.replace(/_/g, " ")}
              </MetaChip>
            )}
            {task.target_keyword && (
              <MetaChip>Keyword: {task.target_keyword}</MetaChip>
            )}
            {task.target_url && <MetaChip>{task.target_url}</MetaChip>}
            {task.assignee?.full_name ? (
              <MetaChip>
                <span className="mr-1 inline-flex size-4 items-center justify-center rounded-full bg-primary align-middle text-[9px] font-semibold text-primary-foreground">
                  {initials(task.assignee.full_name)}
                </span>
                {task.assignee.full_name}
              </MetaChip>
            ) : (
              <MetaChip>Unassigned</MetaChip>
            )}
          </div>

          {/* Inline agent runner */}
          {task.client_id && (
            <form
              action={(formData) => {
                const brief = formData.get("brief") as string;
                startTransition(async () => {
                  setRunError(null);
                  const result = await runSpecialistAgent(
                    agentType,
                    task.client_id!,
                    brief,
                    task.id
                  );
                  if (result.error) setRunError(result.error);
                  router.refresh();
                });
              }}
              className="space-y-3 rounded-xl bg-card p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-end gap-3">
                <div className="w-56 space-y-1.5">
                  <Label
                    htmlFor={`agent-${task.id}`}
                    className="text-xs text-muted-foreground"
                  >
                    Agent
                  </Label>
                  <Select
                    value={agentType}
                    onValueChange={(v) => setAgentType(v as AgentType)}
                  >
                    <SelectTrigger id={`agent-${task.id}`} className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CALLABLE_AGENTS.map((type) => (
                        <SelectItem key={type} value={type}>
                          {AGENT_LABELS[type].label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  type="submit"
                  size="sm"
                  className="rounded-full"
                  disabled={isPending}
                >
                  {isPending ? "Running…" : "Run agent"}
                </Button>
              </div>
              <Textarea
                name="brief"
                rows={2}
                defaultValue={[task.title, task.description]
                  .filter(Boolean)
                  .join("\n")}
                className="text-sm"
                required
              />
              {runError && (
                <p className="text-xs text-destructive">{runError}</p>
              )}
            </form>
          )}

          {/* Run history with formatted outputs */}
          {runs.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  Agent outputs
                </h4>
                {task.client_id && (
                  <Link
                    href={`/outputs?client=${task.client_id}`}
                    className="text-xs font-medium text-accent-foreground hover:underline"
                  >
                    Open in Outputs →
                  </Link>
                )}
              </div>
              {runs.map((run) => (
                <div key={run.id} className="rounded-xl bg-card p-4 shadow-sm">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold">
                      {AGENT_LABELS[run.agent_type]?.label ?? run.agent_type}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {new Date(run.created_at).toLocaleString()}
                      </span>
                      <Badge
                        variant={
                          run.status === "failed" ? "destructive" : "secondary"
                        }
                        className="rounded-full text-xs"
                      >
                        {run.status}
                      </Badge>
                    </div>
                  </div>
                  {run.status === "failed" ? (
                    <p className="text-sm text-destructive">{run.error}</p>
                  ) : (
                    <AgentOutputView
                      output={run.output}
                      editedOutput={run.edited_output}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function PhaseTaskList({
  tasks,
  runsByTask = {},
}: {
  tasks: PhasedTask[];
  runsByTask?: Record<string, TaskRun[]>;
}) {
  const grouped = new Map<string, PhasedTask[]>();
  for (const task of tasks) {
    const phase = task.template?.phase ?? "custom";
    const bucket = grouped.get(phase) ?? [];
    bucket.push(task);
    grouped.set(phase, bucket);
  }

  const phases = PHASE_ORDER.filter((p) => grouped.has(p));

  if (tasks.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No tasks yet. Onboard a client or generate a plan to get started.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {phases.map((phase) => {
        const phaseTasks = grouped.get(phase)!;
        const done = phaseTasks.filter((t) => t.status === "done").length;
        return (
          <section key={phase}>
            <div className="mb-2 flex items-center justify-between px-1">
              <h3 className="text-sm font-bold tracking-tight">
                {PHASE_LABELS[phase] ?? phase}
              </h3>
              <Badge variant="secondary" className="rounded-full">
                {done}/{phaseTasks.length} done
              </Badge>
            </div>
            <div className="overflow-hidden rounded-2xl bg-card shadow-sm">
              {phaseTasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  runs={runsByTask[task.id] ?? []}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
