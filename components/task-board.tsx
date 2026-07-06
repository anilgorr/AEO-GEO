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

const TYPE_COLORS: Record<string, string> = {
  seo: "bg-blue-100 text-blue-800",
  aeo: "bg-purple-100 text-purple-800",
  geo: "bg-fuchsia-100 text-fuchsia-800",
  content: "bg-amber-100 text-amber-800",
  technical: "bg-slate-200 text-slate-800",
  off_page: "bg-emerald-100 text-emerald-800",
};

function TaskCard({ task }: { task: Task }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Card className="mb-3">
      <CardHeader className="space-y-2 pb-2">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium leading-snug">{task.title}</p>
          {task.risk_tier === "high_impact" && (
            <Badge variant="destructive" className="shrink-0">
              High impact
            </Badge>
          )}
        </div>
        <div className="flex flex-wrap gap-1">
          <Badge className={TYPE_COLORS[task.type]} variant="secondary">
            {task.type.toUpperCase()}
          </Badge>
          {task.target_platform && (
            <Badge variant="outline">{task.target_platform}</Badge>
          )}
          {task.approval_state === "pending" && (
            <Badge variant="outline" className="border-amber-500 text-amber-700">
              Awaiting approval
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2 pt-0 text-sm text-muted-foreground">
        {task.clients?.name && <p>Client: {task.clients.name}</p>}
        {task.target_keyword && <p>Keyword: {task.target_keyword}</p>}
        {task.assignee?.full_name && (
          <p>Assignee: {task.assignee.full_name}</p>
        )}
        {task.due_date && <p>Due: {task.due_date}</p>}

        <Select
          value={task.status}
          disabled={isPending}
          onValueChange={(value) =>
            startTransition(() =>
              updateTaskStatus(task.id, value as TaskStatus)
            )
          }
        >
          <SelectTrigger className="mt-2 h-8 text-xs">
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
          <div key={column.value} className="rounded-lg bg-muted/40 p-3">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold">{column.label}</h2>
              <Badge variant="secondary">{columnTasks.length}</Badge>
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
