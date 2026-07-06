import { Card, CardContent } from "@/components/ui/card";
import type { Task } from "@/lib/types";

export function StatCards({ tasks }: { tasks: Task[] }) {
  const total = tasks.length;
  const inProgress = tasks.filter((t) => t.status === "in_progress").length;
  const overdue = tasks.filter(
    (t) => t.due_date && t.due_date < new Date().toISOString().slice(0, 10) && t.status !== "done"
  ).length;
  const done = tasks.filter((t) => t.status === "done").length;
  const completionRate = total === 0 ? 0 : Math.round((done / total) * 100);

  const stats = [
    { label: "Total tasks", value: total, sub: `${inProgress} in progress` },
    { label: "Overdue", value: overdue, sub: "past due date", tone: overdue > 0 ? "text-destructive" : "" },
    { label: "Completed", value: done, sub: `${completionRate}% completion rate`, tone: "text-emerald-600" },
  ];

  return (
    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
      {stats.map((stat) => (
        <Card key={stat.label} className="border-none shadow-sm">
          <CardContent className="py-1">
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <p className={`text-3xl font-semibold tracking-tight ${stat.tone ?? ""}`}>
              {stat.value}
            </p>
            <p className="text-xs text-muted-foreground">{stat.sub}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
