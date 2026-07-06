import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/header";
import { Sidebar } from "@/components/sidebar";
import { StatCards } from "@/components/stat-cards";
import { TaskBoard } from "@/components/task-board";
import { CreateTaskDialog } from "@/components/create-task-dialog";
import { CreateClientDialog } from "@/components/create-client-dialog";
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
      <Sidebar clients={clients ?? []} activeClientId={activeClientId} />
      <div className="flex-1">
        <Header
          fullName={profile?.full_name ?? user.email ?? "User"}
          role={profile?.role ?? "seo_specialist"}
        />
        <main className="p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">
                {activeClient ? activeClient.name : "All clients"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {tasks?.length ?? 0} tasks
                {!activeClientId && ` across ${clients?.length ?? 0} clients`}
              </p>
            </div>
            <div className="flex gap-2">
              <CreateClientDialog />
              <CreateTaskDialog
                clients={clients ?? []}
                employees={employees ?? []}
              />
            </div>
          </div>
          <StatCards tasks={tasks ?? []} />
          <TaskBoard tasks={tasks ?? []} />
        </main>
      </div>
    </div>
  );
}
