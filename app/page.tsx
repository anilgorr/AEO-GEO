import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/header";
import { TaskBoard } from "@/components/task-board";
import { CreateTaskDialog } from "@/components/create-task-dialog";
import { CreateClientDialog } from "@/components/create-client-dialog";
import type { Profile, Task, Client } from "@/lib/types";

export default async function DashboardPage() {
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

  const [{ data: tasks }, { data: clients }, { data: employees }] =
    await Promise.all([
      supabase
        .from("tasks")
        .select(
          "*, clients(id, name), assignee:profiles!tasks_assignee_id_fkey(id, full_name)"
        )
        .order("created_at", { ascending: false })
        .returns<Task[]>(),
      supabase.from("clients").select("*").returns<Client[]>(),
      supabase.from("profiles").select("*").returns<Profile[]>(),
    ]);

  return (
    <div>
      <Header
        fullName={profile?.full_name ?? user.email ?? "User"}
        role={profile?.role ?? "seo_specialist"}
      />
      <main className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {tasks?.length ?? 0} total tasks across {clients?.length ?? 0}{" "}
            clients
          </p>
          <div className="flex gap-2">
            <CreateClientDialog />
            <CreateTaskDialog
              clients={clients ?? []}
              employees={employees ?? []}
            />
          </div>
        </div>
        <TaskBoard tasks={tasks ?? []} />
      </main>
    </div>
  );
}
