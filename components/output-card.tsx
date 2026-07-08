"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  runSpecialistAgent,
  updateAgentRunOutput,
} from "@/app/(dashboard)/agent-actions";
import { AgentOutputView } from "@/components/agent-output-view";
import { outputToText } from "@/lib/output-text";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AGENT_LABELS, type AgentType } from "@/lib/types";

const CHAINABLE_AGENTS: AgentType[] = [
  "keyword",
  "onpage",
  "audit",
  "schema",
  "geo",
  "offpage",
  "sitemap",
];

export interface OutputRun {
  id: string;
  agent_type: AgentType;
  client_id: string | null;
  status: string;
  output: Record<string, unknown> | null;
  edited_output: string | null;
  error: string | null;
  created_at: string;
  clients?: { name: string } | null;
  task?: { title: string } | null;
}

export function OutputCard({ run }: { run: OutputRun }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState("");
  const [chainAgent, setChainAgent] = useState<AgentType>("onpage");
  const [chainMessage, setChainMessage] = useState<string | null>(null);

  const meta = AGENT_LABELS[run.agent_type];
  const outputAsText = run.edited_output ?? outputToText(run.output);

  return (
    <Card className="border-none shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div>
          <p className="text-base font-semibold">{meta?.label ?? run.agent_type}</p>
          <p className="text-xs text-muted-foreground">
            {run.clients?.name && <>{run.clients.name} · </>}
            {run.task?.title && <>Task: {run.task.title} · </>}
            {new Date(run.created_at).toLocaleString()}
          </p>
        </div>
        <Badge
          variant={run.status === "failed" ? "destructive" : "secondary"}
          className="shrink-0 rounded-full"
        >
          {run.status}
        </Badge>
      </CardHeader>

      <CardContent className="space-y-4">
        {run.status === "failed" && (
          <p className="text-sm text-destructive">{run.error}</p>
        )}

        {run.status === "completed" && !editing && (
          <AgentOutputView
            output={run.output}
            editedOutput={run.edited_output}
            clientId={run.client_id}
            agentType={run.agent_type}
          />
        )}

        {editing && (
          <div className="space-y-2">
            <Textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              rows={12}
              className="font-mono text-xs"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                className="rounded-full"
                disabled={isPending}
                onClick={() =>
                  startTransition(async () => {
                    await updateAgentRunOutput(run.id, editText);
                    setEditing(false);
                    router.refresh();
                  })
                }
              >
                {isPending ? "Saving…" : "Save"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="rounded-full"
                onClick={() => setEditing(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {run.status === "completed" && !editing && (
          <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
            <Button
              size="sm"
              variant="outline"
              className="rounded-full"
              onClick={() => {
                setEditText(outputAsText);
                setEditing(true);
              }}
            >
              Edit
            </Button>

            <div className="ml-auto flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Send to</span>
              <Select
                value={chainAgent}
                onValueChange={(v) => setChainAgent(v as AgentType)}
              >
                <SelectTrigger className="h-8 w-44 rounded-full text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CHAINABLE_AGENTS.map((type) => (
                    <SelectItem key={type} value={type}>
                      {AGENT_LABELS[type].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                className="rounded-full"
                disabled={isPending || !run.client_id}
                onClick={() =>
                  startTransition(async () => {
                    setChainMessage(null);
                    const result = await runSpecialistAgent(
                      chainAgent,
                      run.client_id!,
                      `Input from a previous ${meta?.label ?? run.agent_type} run:\n\n${outputAsText}`
                    );
                    setChainMessage(
                      result.error
                        ? `Failed: ${result.error}`
                        : `Done — new ${AGENT_LABELS[chainAgent].label} output saved above.`
                    );
                    router.refresh();
                  })
                }
              >
                {isPending ? "Running…" : "Run"}
              </Button>
            </div>
          </div>
        )}

        {chainMessage && (
          <p className="text-xs text-muted-foreground">{chainMessage}</p>
        )}
      </CardContent>
    </Card>
  );
}
