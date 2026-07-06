import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Task } from "@/lib/types";

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function DueThisWeek({ tasks }: { tasks: Task[] }) {
  const today = new Date();
  const weekFromNow = new Date(today);
  weekFromNow.setDate(today.getDate() + 7);

  const upcoming = tasks
    .filter(
      (t) =>
        t.due_date &&
        t.status !== "done" &&
        new Date(t.due_date) <= weekFromNow
    )
    .sort((a, b) => (a.due_date ?? "").localeCompare(b.due_date ?? ""))
    .slice(0, 8);

  return (
    <aside className="hidden w-72 shrink-0 lg:block">
      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Due this week</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {upcoming.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Nothing due in the next 7 days.
            </p>
          )}
          {upcoming.map((task) => {
            const overdue = task.due_date! < today.toISOString().slice(0, 10);
            return (
              <div
                key={task.id}
                className={`flex items-center gap-3 rounded-xl border-l-4 bg-muted/40 px-3 py-2 ${
                  overdue ? "border-l-destructive" : "border-l-blue-500"
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{task.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {task.due_date}
                    {task.clients?.name ? ` · ${task.clients.name}` : ""}
                  </p>
                </div>
                {task.assignee?.full_name && (
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
                    {initials(task.assignee.full_name)}
                  </span>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </aside>
  );
}
