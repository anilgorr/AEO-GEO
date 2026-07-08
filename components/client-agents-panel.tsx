"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { runPlanningAgent } from "@/app/(dashboard)/agent-actions";
import { AgentTriggerDialog } from "@/components/agent-trigger-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DialogTrigger } from "@/components/ui/dialog";
import { AGENT_LABELS, type AgentType } from "@/lib/types";

const CALLABLE_AGENTS: AgentType[] = [
  "keyword",
  "onpage",
  "audit",
  "schema",
  "geo",
  "offpage",
  "sitemap",
];

export function ClientAgentsPanel({ clientId }: { clientId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Card className="mb-6 border-none shadow-sm">
      <CardContent className="flex flex-wrap items-center gap-2 py-4">
        <span className="mr-1 text-sm font-medium text-muted-foreground">
          Agents:
        </span>
        {CALLABLE_AGENTS.map((type) => (
          <AgentTriggerDialog
            key={type}
            agentType={type}
            agentLabel={AGENT_LABELS[type].label}
            clientId={clientId}
            trigger={
              <DialogTrigger
                render={<Button size="sm" variant="outline" className="rounded-full" />}
              >
                {AGENT_LABELS[type].label}
              </DialogTrigger>
            }
          />
        ))}
        <Button
          size="sm"
          variant="outline"
          className="rounded-full"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              const { runId, error } = await runPlanningAgent(clientId);
              if (!error) {
                router.push(`/plan-review?client=${clientId}&run=${runId}`);
              }
            })
          }
        >
          {isPending ? "Running…" : "Re-run Planning Agent"}
        </Button>
      </CardContent>
    </Card>
  );
}
