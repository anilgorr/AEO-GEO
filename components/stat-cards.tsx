import { Card, CardContent } from "@/components/ui/card";
import type { Task } from "@/lib/types";

function ListIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 6h13M8 12h13M8 18h13" />
      <path d="M3 6h.01M3 12h.01M3 18h.01" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v5M12 16h.01" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 12.5l2.5 2.5 5-5" />
    </svg>
  );
}

export function StatCards({ tasks }: { tasks: Task[] }) {
  const total = tasks.length;
  const inProgress = tasks.filter((t) => t.status === "in_progress").length;
  const overdue = tasks.filter(
    (t) => t.due_date && t.due_date < new Date().toISOString().slice(0, 10) && t.status !== "done"
  ).length;
  const done = tasks.filter((t) => t.status === "done").length;
  const completionRate = total === 0 ? 0 : Math.round((done / total) * 100);

  const stats = [
    {
      label: "Total tasks",
      value: total,
      sub: `${inProgress} in progress`,
      icon: <ListIcon />,
      badge: "bg-gradient-to-br from-blue-500 to-cyan-400",
    },
    {
      label: "Overdue",
      value: overdue,
      sub: "past due date",
      tone: overdue > 0 ? "text-destructive" : "",
      icon: <AlertIcon />,
      badge: "bg-gradient-to-br from-rose-500 to-orange-400",
    },
    {
      label: "Completed",
      value: done,
      sub: `${completionRate}% completion rate`,
      tone: "text-emerald-600",
      icon: <CheckIcon />,
      badge: "bg-gradient-to-br from-emerald-500 to-teal-400",
    },
  ];

  return (
    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
      {stats.map((stat) => (
        <Card key={stat.label} className="border-none shadow-sm">
          <CardContent className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className={`text-3xl font-semibold tracking-tight ${stat.tone ?? ""}`}>
                {stat.value}
              </p>
              <p className="text-xs text-muted-foreground">{stat.sub}</p>
            </div>
            <span
              className={`flex size-11 shrink-0 items-center justify-center rounded-2xl text-white shadow-sm ${stat.badge}`}
            >
              <span className="size-5">{stat.icon}</span>
            </span>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
