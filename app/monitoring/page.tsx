import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/header";
import { Sidebar } from "@/components/sidebar";
import { TrackedPhrases } from "@/components/tracked-phrases";
import { VisibilityDashboard } from "@/components/visibility-dashboard";
import { RunCitationCheckButton } from "@/components/run-citation-check-button";
import { CreateTaskDialog } from "@/components/create-task-dialog";
import { Button } from "@/components/ui/button";
import { DialogTrigger } from "@/components/ui/dialog";
import type { Client, Profile } from "@/lib/types";

export default async function MonitoringPage({
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

  const [{ data: clients }, { data: employees }] = await Promise.all([
    supabase.from("clients").select("*").returns<Client[]>(),
    supabase.from("profiles").select("*").returns<Profile[]>(),
  ]);

  const activeClient =
    clients?.find((c) => c.id === activeClientId) ?? clients?.[0] ?? null;

  let phrases: { id: string; phrase: string; locked: boolean }[] = [];
  let checks: {
    platform: "chatgpt" | "claude" | "perplexity" | "google_aio";
    cited: boolean;
    checked_at: string;
  }[] = [];

  if (activeClient) {
    const { data: phraseRows } = await supabase
      .from("tracked_phrases")
      .select("id, phrase, locked")
      .eq("client_id", activeClient.id)
      .order("created_at", { ascending: true });
    phrases = phraseRows ?? [];

    const phraseIds = phrases.map((p) => p.id);
    if (phraseIds.length > 0) {
      const { data: checkRows } = await supabase
        .from("citation_checks")
        .select("platform, cited, checked_at")
        .in("phrase_id", phraseIds);
      checks = checkRows ?? [];
    }
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar
        clients={clients ?? []}
        activeClientId={activeClient?.id}
        activePage="monitoring"
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
          {!activeClient ? (
            <p className="text-sm text-muted-foreground">
              Add a client first to start tracking visibility.
            </p>
          ) : (
            <>
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold tracking-tight">
                    {activeClient.name} — Visibility monitoring
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Citation checks via direct provider APIs (Perplexity,
                    ChatGPT, Claude). Google AI Overviews requires a
                    SERP-scraping source, not shown here yet.
                  </p>
                </div>
                <RunCitationCheckButton clientId={activeClient.id} />
              </div>
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <TrackedPhrases clientId={activeClient.id} phrases={phrases} />
                <VisibilityDashboard checks={checks} />
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
