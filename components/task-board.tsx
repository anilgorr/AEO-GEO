"use client";

import { useTransition } from "react";
import { updateTaskStatus } from "@/app/(dashboard)/tasks-actions";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TASK_STATUSES, type Task, type TaskStatus } from "@/lib/types";

const TYPE_DOT: Record<string, string> = {
  seo: "bg-blue-600",
  aeo: "bg-violet-600",
  geo: "bg-fuchsia-600",
  content: "bg-amber-500",
  technical: "bg-slate-500",
  off_page: "bg-emerald-600",
};

const TYPE_BORDER: Record<string, string> = {
  seo: "border-l-blue-500",
  aeo: "border-l-violet-500",
  geo: "border-l-fuchsia-500",
  content: "border-l-amber-500",
  technical: "border-l-slate-400",
  off_page: "border-l-emerald-500",
};

function Dot({ className }: { className: string }) {
  return <span className={`inline-block size-1.5 rounded-full ${className}`} />;
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function TaskCard({ task }: { task: Task }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Card
      className={`mb-3 gap-3 border-y-0 border-r-0 border-l-4 py-4 shadow-sm ${TYPE_BORDER[task.type]}`}
    >
      <CardHeader className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium leading-snug">{task.title}</p>
          {task.risk_tier === "high_impact" && (
            <span className="inline-flex shrink-0 items-center gap-1.5 text-xs font-medium text-destructive">
              <Dot className="bg-destructive" />
              High impact
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Dot className={TYPE_DOT[task.type]} />
            {task.type.toUpperCase()}
          </span>
          {task.target_platform && <span>{task.target_platform}</span>}
          {task.approval_state === "pending" && (
            <span className="inline-flex items-center gap-1.5 text-amber-600">
              <Dot className="bg-amber-500" />
              Awaiting approval
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-1.5 text-sm text-muted-foreground">
        {task.clients?.name && <p>Client: {task.clients.name}</p>}
        {task.target_keyword && <p>Keyword: {task.target_keyword}</p>}
        {task.due_date && <p>Due: {task.due_date}</p>}

        <div className="flex items-center justify-between pt-1">
          {task.assignee?.full_name ? (
            <span className="flex items-center gap-2">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
                {initials(task.assignee.full_name)}
              </span>
              <span className="truncate text-xs">
                {task.assignee.full_name}
              </span>
            </span>
          ) : (
            <span className="text-xs italic">Unassigned</span>
          )}
        </div>

        <Select
          value={task.status}
          disabled={isPending}
          onValueChange={(value) =>
            startTransition(() =>
              updateTaskStatus(task.id, value as TaskStatus)
            )
          }
        >
          <SelectTrigger className="mt-1 h-8 rounded-full text-xs">
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
      </CardContent>
    </Card>
  );
}

export function TaskBoard({ tasks }: { tasks: Task[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
      {TASK_STATUSES.map((column) => {
        const columnTasks = tasks.filter((t) => t.status === column.value);
        return (
          <div key={column.value} className="rounded-2xl bg-muted/40 p-3">
            <div className="mb-3 flex items-center justify-between px-1">
              <h2 className="text-sm font-semibold">{column.label}</h2>
              <Badge variant="secondary" className="rounded-full">
                {columnTasks.length}
              </Badge>
            </div>
            {columnTasks.length === 0 && (
              <p className="text-xs text-muted-foreground">No tasks</p>
            )}
            {columnTasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        );
      })}
    </div>
  );
}
