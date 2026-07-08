"use client";

import { useTransition } from "react";
import { updateTaskStatus } from "@/app/(dashboard)/tasks-actions";
import {
  TaskAgentRunner,
  type TaskRunSummary,
} from "@/components/task-agent-runner";
import { Badge } from "@/components/ui/badge";
import type { Task } from "@/lib/types";

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

export interface PhasedTask extends Task {
  template?: { phase: string } | null;
}

function TaskRow({
  task,
  latestRun,
}: {
  task: PhasedTask;
  latestRun: TaskRunSummary | null;
}) {
  const [isPending, startTransition] = useTransition();
  const done = task.status === "done";

  return (
    <div className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-b-0 hover:bg-muted/30">
      <input
        type="checkbox"
        checked={done}
        disabled={isPending}
        onChange={(e) =>
          startTransition(() =>
            updateTaskStatus(task.id, e.target.checked ? "done" : "todo")
          )
        }
        className="size-4 shrink-0 cursor-pointer accent-primary"
        title={done ? "Mark as to do" : "Mark as done"}
      />
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
          {task.target_keyword ? ` · ${task.target_keyword}` : ""}
          {task.due_date ? ` · due ${task.due_date}` : ""}
          {task.risk_tier === "high_impact" ? " · HIGH IMPACT" : ""}
        </p>
      </div>
      {task.client_id && (
        <TaskAgentRunner
          taskId={task.id}
          clientId={task.client_id}
          taskTitle={task.title}
          taskDescription={task.description}
          taskType={task.type}
          latestRun={latestRun}
        />
      )}
    </div>
  );
}

export function PhaseTaskList({
  tasks,
  runsByTask = {},
}: {
  tasks: PhasedTask[];
  runsByTask?: Record<string, TaskRunSummary>;
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
                  latestRun={runsByTask[task.id] ?? null}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
