import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/header";
import { Sidebar } from "@/components/sidebar";
import { StatCards } from "@/components/stat-cards";
import { TaskBoard } from "@/components/task-board";
import { DueThisWeek } from "@/components/due-this-week";
import { CreateTaskDialog } from "@/components/create-task-dialog";
import { CreateClientDialog } from "@/components/create-client-dialog";
import { GeneratePlanButton } from "@/components/generate-plan-button";
import { Button } from "@/components/ui/button";
import { DialogTrigger } from "@/components/ui/dialog";
import type { Profile, Task, Client } from "@/lib/types";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ client?: string }>;
}) {
  const { client: activeClientId } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>();

  let taskQuery = supabase
    .from("tasks")
    .select(
      "*, clients(id, name), assignee:profiles!tasks_assignee_id_fkey(id, full_name)"
    )
    .order("created_at", { ascending: false });

  if (activeClientId) {
    taskQuery = taskQuery.eq("client_id", activeClientId);
  }

  const [{ data: tasks }, { data: clients }, { data: employees }] =
    await Promise.all([
      taskQuery.returns<Task[]>(),
      supabase.from("clients").select("*").returns<Client[]>(),
      supabase.from("profiles").select("*").returns<Profile[]>(),
    ]);

  const activeClient = clients?.find((c) => c.id === activeClientId);

  return (
    <div className="flex min-h-screen">
      <Sidebar
        clients={clients ?? []}
        activeClientId={activeClientId}
        activePage="dashboard"
        newTaskTrigger={
          <CreateTaskDialog
            clients={clients ?? []}
            employees={employees ?? []}
            trigger={
              <DialogTrigger
                render={
                  <Button className="w-full justify-center rounded-full bg-gradient-to-br from-blue-600 to-cyan-500" />
                }
              >
                New task
              </DialogTrigger>
            }
          />
        }
      />
      <div className="flex-1">
        <Header
          fullName={profile?.full_name ?? user.email ?? "User"}
          role={profile?.role ?? "seo_specialist"}
        />
        <div className="flex gap-6 p-6">
          <main className="min-w-0 flex-1">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold tracking-tight">
                  {activeClient ? activeClient.name : "All clients"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {tasks?.length ?? 0} tasks
                  {!activeClientId &&
                    ` across ${clients?.length ?? 0} clients`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {activeClient && (
                  <GeneratePlanButton clientId={activeClient.id} />
                )}
                <CreateClientDialog />
              </div>
            </div>
            <StatCards tasks={tasks ?? []} />
            <TaskBoard tasks={tasks ?? []} />
          </main>
          <DueThisWeek tasks={tasks ?? []} />
        </div>
      </div>
    </div>
  );
}
