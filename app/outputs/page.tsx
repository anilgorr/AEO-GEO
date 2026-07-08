import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/header";
import { Sidebar } from "@/components/sidebar";
import { OutputCard, type OutputRun } from "@/components/output-card";
import { CreateTaskDialog } from "@/components/create-task-dialog";
import { Button } from "@/components/ui/button";
import { DialogTrigger } from "@/components/ui/dialog";
import type { Client, Profile } from "@/lib/types";

export default async function OutputsPage({
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

  let runQuery = supabase
    .from("agent_runs")
    .select("*, clients(name), task:tasks(title)")
    .order("created_at", { ascending: false })
    .limit(50);

  if (activeClientId) {
    runQuery = runQuery.eq("client_id", activeClientId);
  }

  const [{ data: runs }, { data: clients }, { data: employees }] =
    await Promise.all([
      runQuery.returns<OutputRun[]>(),
      supabase.from("clients").select("*").returns<Client[]>(),
      supabase.from("profiles").select("*").returns<Profile[]>(),
    ]);

  const activeClient = clients?.find((c) => c.id === activeClientId);

  return (
    <div className="flex min-h-screen">
      <Sidebar
        clients={clients ?? []}
        activeClientId={activeClientId}
        activePage="outputs"
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
        <main className="p-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold tracking-tight">
              Outputs{activeClient ? ` — ${activeClient.name}` : ""}
            </h2>
            <p className="text-sm text-muted-foreground">
              Every agent result, formatted and editable. Edit an output or
              send it as input to another agent.
            </p>
          </div>

          {(!runs || runs.length === 0) && (
            <p className="text-sm text-muted-foreground">
              No agent outputs yet
              {activeClient ? ` for ${activeClient.name}` : ""}. Run an agent
              from a task row or the Agents page.
            </p>
          )}

          <div className="mx-auto max-w-3xl space-y-4">
            {runs?.map((run) => <OutputCard key={run.id} run={run} />)}
          </div>
        </main>
      </div>
    </div>
  );
}
