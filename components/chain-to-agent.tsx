"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { runSpecialistAgent } from "@/app/(dashboard)/agent-actions";
import { Button } from "@/components/ui/button";
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

/**
 * "Send this output to another agent" control. Feeds the given text into
 * the chosen specialist; when taskId is set, the new run attaches to the
 * same task so its output shows up in that task's history.
 */
export function ChainToAgent({
  clientId,
  taskId,
  sourceLabel,
  sourceText,
}: {
  clientId: string;
  taskId?: string;
  sourceLabel: string;
  sourceText: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [agentType, setAgentType] = useState<AgentType>("onpage");
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-muted-foreground">Send to</span>
      <Select
        value={agentType}
        onValueChange={(v) => setAgentType(v as AgentType)}
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
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            setMessage(null);
            const result = await runSpecialistAgent(
              agentType,
              clientId,
              `Input from a previous ${sourceLabel} run:\n\n${sourceText}`,
              taskId
            );
            setMessage(
              result.error
                ? `Failed: ${result.error}`
                : `Done — ${AGENT_LABELS[agentType].label} output saved.`
            );
            router.refresh();
          })
        }
      >
        {isPending ? "Running…" : "Run"}
      </Button>
      {message && <p className="text-xs text-muted-foreground">{message}</p>}
    </div>
  );
}
