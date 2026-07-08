"use client";

import { useTransition } from "react";
import { updateTaskStatus } from "@/app/(dashboard)/tasks-actions";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TASK_STATUSES, type Task, type TaskStatus } from "@/lib/types";

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

const STATUS_STYLES: Record<string, string> = {
  todo: "bg-slate-100 text-slate-700",
  in_progress: "bg-blue-100 text-blue-800",
  review: "bg-amber-100 text-amber-800",
  done: "bg-emerald-100 text-emerald-800",
};

export interface PhasedTask extends Task {
  template?: { phase: string } | null;
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function TaskRow({ task }: { task: PhasedTask }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-4 border-b border-border px-4 py-3 last:border-b-0 hover:bg-muted/30">
      <span
        className={`size-2 shrink-0 rounded-full ${TYPE_DOT[task.type] ?? "bg-slate-400"}`}
        title={task.type}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{task.title}</p>
        <p className="truncate text-xs text-muted-foreground">
          {task.type.toUpperCase()}
          {task.target_keyword ? ` · ${task.target_keyword}` : ""}
          {task.due_date ? ` · due ${task.due_date}` : ""}
          {task.risk_tier === "high_impact" ? " · HIGH IMPACT" : ""}
        </p>
      </div>
      <div className="hidden shrink-0 items-center gap-2 sm:flex">
        {task.assignee?.full_name ? (
          <span
            className="flex size-6 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground"
            title={task.assignee.full_name}
          >
            {initials(task.assignee.full_name)}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground italic">
            Unassigned
          </span>
        )}
      </div>
      <Select
        value={task.status}
        disabled={isPending}
        onValueChange={(value) =>
          startTransition(() => updateTaskStatus(task.id, value as TaskStatus))
        }
      >
        <SelectTrigger
          className={`h-7 w-32 shrink-0 rounded-full border-none text-xs font-medium ${STATUS_STYLES[task.status]}`}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {TASK_STATUSES.map((s) => (
            <SelectItem key={s.value} value={s.value}>
              {s.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function PhaseTaskList({ tasks }: { tasks: PhasedTask[] }) {
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
                <TaskRow key={task.id} task={task} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
