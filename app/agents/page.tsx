import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/header";
import { Sidebar } from "@/components/sidebar";
import { AgentTriggerDialog } from "@/components/agent-trigger-dialog";
import { CreateTaskDialog } from "@/components/create-task-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DialogTrigger } from "@/components/ui/dialog";
import { AGENT_LABELS, type AgentType, type Client, type Profile } from "@/lib/types";

const BUILT_AGENTS: AgentType[] = ["planning", "monitoring", "keyword", "onpage"];
const CALLABLE_AGENTS: AgentType[] = ["keyword", "onpage"];

export default async function AgentsPage() {
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

  const [{ data: clients }, { data: employees }, { data: recentRuns }] =
    await Promise.all([
      supabase.from("clients").select("*").returns<Client[]>(),
      supabase.from("profiles").select("*").returns<Profile[]>(),
      supabase
        .from("agent_runs")
        .select("*, clients(name)")
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

  return (
    <div className="flex min-h-screen">
      <Sidebar
        clients={clients ?? []}
        activePage="agents"
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
          <h2 className="mb-1 text-xl font-bold tracking-tight">Agents</h2>
          <p className="mb-6 text-sm text-muted-foreground">
            The Planning Agent runs automatically from client onboarding.
            Specialist agents below can be called directly on any client.
          </p>

          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(Object.keys(AGENT_LABELS) as AgentType[]).map((type) => {
              const meta = AGENT_LABELS[type];
              const isBuilt = BUILT_AGENTS.includes(type);
              const isCallable = CALLABLE_AGENTS.includes(type);
              return (
                <Card key={type} className="border-none shadow-sm">
                  <CardHeader className="flex flex-row items-start justify-between gap-2">
                    <CardTitle className="text-base">{meta.label}</CardTitle>
                    <Badge
                      variant={isBuilt ? "secondary" : "outline"}
                      className="rounded-full text-xs"
                    >
                      {isBuilt ? "Available" : "Coming soon"}
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      {meta.description}
                    </p>
                    {isCallable && (
                      <AgentTriggerDialog
                        agentType={type}
                        agentLabel={meta.label}
                        clients={clients ?? []}
                      />
                    )}
                    {type === "planning" && (
                      <p className="text-xs text-muted-foreground italic">
                        Triggered automatically when a client is onboarded.
                      </p>
                    )}
                    {type === "monitoring" && (
                      <p className="text-xs text-muted-foreground italic">
                        Available from the Monitoring page.
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <h3 className="mb-3 text-base font-semibold">Recent agent runs</h3>
          <div className="space-y-2">
            {(!recentRuns || recentRuns.length === 0) && (
              <p className="text-sm text-muted-foreground">No runs yet.</p>
            )}
            {recentRuns?.map((run) => (
              <div
                key={run.id}
                className="flex items-center justify-between rounded-xl bg-muted/40 px-4 py-2.5 text-sm"
              >
                <div>
                  <span className="font-medium">
                    {AGENT_LABELS[run.agent_type as AgentType]?.label ??
                      run.agent_type}
                  </span>
                  {run.clients?.name && (
                    <span className="text-muted-foreground">
                      {" "}
                      · {run.clients.name}
                    </span>
                  )}
                </div>
                <Badge
                  variant={run.status === "failed" ? "destructive" : "secondary"}
                  className="rounded-full"
                >
                  {run.status}
                </Badge>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
