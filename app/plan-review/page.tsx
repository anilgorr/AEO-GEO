import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/header";
import { Sidebar } from "@/components/sidebar";
import { PlanReview } from "@/components/plan-review";
import { CreateTaskDialog } from "@/components/create-task-dialog";
import { Button } from "@/components/ui/button";
import { DialogTrigger } from "@/components/ui/dialog";
import type { Client, Profile, PlanningAgentOutput } from "@/lib/types";

export default async function PlanReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ client?: string; run?: string }>;
}) {
  const { client: clientId, run: runId } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  if (!clientId || !runId) redirect("/");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>();

  const [{ data: clients }, { data: employees }, { data: run }] =
    await Promise.all([
      supabase.from("clients").select("*").returns<Client[]>(),
      supabase.from("profiles").select("*").returns<Profile[]>(),
      supabase.from("agent_runs").select("*").eq("id", runId).single(),
    ]);

  const client = clients?.find((c) => c.id === clientId);

  return (
    <div className="flex min-h-screen">
      <Sidebar
        clients={clients ?? []}
        activeClientId={clientId}
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
        <main className="p-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold tracking-tight">
              Review plan — {client?.name ?? "Client"}
            </h2>
            <p className="text-sm text-muted-foreground">
              The Planning Agent has proposed the tasks below. Nothing is
              created until you approve.
            </p>
          </div>

          {!run && (
            <p className="text-sm text-muted-foreground">
              Agent run not found.
            </p>
          )}
          {run?.status === "failed" && (
            <p className="text-sm text-destructive">
              Planning Agent failed: {run.error}
            </p>
          )}
          {run?.status === "completed" && client && (
            <PlanReview
              clientId={client.id}
              summary={(run.output as PlanningAgentOutput).summary}
              proposals={(run.output as PlanningAgentOutput).proposed_tasks}
            />
          )}
        </main>
      </div>
    </div>
  );
}
