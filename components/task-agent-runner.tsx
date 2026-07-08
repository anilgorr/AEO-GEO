"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { runSpecialistAgent } from "@/app/(dashboard)/agent-actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AGENT_LABELS, type AgentType, type TaskType } from "@/lib/types";

const CALLABLE_AGENTS: AgentType[] = [
  "keyword",
  "onpage",
  "audit",
  "schema",
  "geo",
  "offpage",
  "sitemap",
];

// Sensible default specialist per task type; user can override in the dialog.
const DEFAULT_AGENT_BY_TYPE: Record<TaskType, AgentType> = {
  seo: "keyword",
  aeo: "onpage",
  geo: "geo",
  content: "onpage",
  technical: "audit",
  off_page: "offpage",
};

export interface TaskRunSummary {
  agent_type: AgentType;
  status: string;
  output: Record<string, unknown> | null;
  error?: string | null;
}

export function TaskAgentRunner({
  taskId,
  clientId,
  taskTitle,
  taskDescription,
  taskType,
  latestRun,
}: {
  taskId: string;
  clientId: string;
  taskTitle: string;
  taskDescription: string | null;
  taskType: TaskType;
  latestRun: TaskRunSummary | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [agentType, setAgentType] = useState<AgentType>(
    DEFAULT_AGENT_BY_TYPE[taskType]
  );
  const [liveOutput, setLiveOutput] = useState<string | null>(null);

  const savedOutput =
    latestRun?.status === "completed" && latestRun.output
      ? JSON.stringify(latestRun.output, null, 2)
      : null;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setLiveOutput(null);
      }}
    >
      <DialogTrigger
        render={
          <Button
            size="sm"
            variant={savedOutput ? "secondary" : "outline"}
            className="shrink-0 rounded-full text-xs"
          />
        }
      >
        {savedOutput
          ? `Output · ${AGENT_LABELS[latestRun!.agent_type].label}`
          : "Run agent"}
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="pr-8 text-base leading-snug">
            {taskTitle}
          </DialogTitle>
        </DialogHeader>

        <form
          action={(formData) => {
            const brief = formData.get("brief") as string;
            startTransition(async () => {
              const result = await runSpecialistAgent(
                agentType,
                clientId,
                brief,
                taskId
              );
              setLiveOutput(
                result.error
                  ? `Error: ${result.error}`
                  : JSON.stringify(result.output, null, 2)
              );
              router.refresh();
            });
          }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor={`agent-${taskId}`}>Agent</Label>
            <Select
              value={agentType}
              onValueChange={(v) => setAgentType(v as AgentType)}
            >
              <SelectTrigger id={`agent-${taskId}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CALLABLE_AGENTS.map((type) => (
                  <SelectItem key={type} value={type}>
                    {AGENT_LABELS[type].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`brief-${taskId}`}>Brief</Label>
            <Textarea
              id={`brief-${taskId}`}
              name="brief"
              rows={3}
              defaultValue={[taskTitle, taskDescription]
                .filter(Boolean)
                .join("\n")}
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending
              ? "Running…"
              : savedOutput
                ? "Re-run agent"
                : "Run agent"}
          </Button>
        </form>

        {(liveOutput ?? savedOutput) && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">
              {liveOutput ? "Latest output" : "Saved output"}
            </p>
            <pre className="max-h-72 overflow-auto rounded-lg bg-muted p-3 text-xs whitespace-pre-wrap">
              {liveOutput ?? savedOutput}
            </pre>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
