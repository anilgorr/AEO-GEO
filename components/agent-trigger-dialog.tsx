"use client";

import { useRef, useState, useTransition } from "react";
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
import type { AgentType, Client } from "@/lib/types";

export function AgentTriggerDialog({
  agentType,
  agentLabel,
  clients,
  clientId: fixedClientId,
  trigger,
}: {
  agentType: AgentType;
  agentLabel: string;
  clients?: Client[];
  clientId?: string;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [output, setOutput] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setOutput(null);
      }}
    >
      {trigger ?? (
        <DialogTrigger render={<Button size="sm" className="rounded-full" />}>
          Run
        </DialogTrigger>
      )}
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{agentLabel}</DialogTitle>
        </DialogHeader>
        <form
          ref={formRef}
          action={(formData) => {
            const clientId =
              fixedClientId ?? (formData.get("client_id") as string);
            const brief = formData.get("brief") as string;
            startTransition(async () => {
              const result = await runSpecialistAgent(
                agentType,
                clientId,
                brief
              );
              setOutput(
                result.error
                  ? `Error: ${result.error}`
                  : JSON.stringify(result.output, null, 2)
              );
            });
          }}
          className="space-y-4"
        >
          {!fixedClientId && (
            <div className="space-y-2">
              <Label htmlFor="client_id">Client</Label>
              <Select name="client_id" required>
                <SelectTrigger id="client_id">
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent>
                  {clients?.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="brief">Task / brief</Label>
            <Textarea
              id="brief"
              name="brief"
              rows={4}
              placeholder="e.g. Cluster keywords around 'project management for small teams', or review https://example.com/pricing for citability"
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Running…" : "Run agent"}
          </Button>
        </form>
        {output && (
          <pre className="max-h-64 overflow-auto rounded-lg bg-muted p-3 text-xs whitespace-pre-wrap">
            {output}
          </pre>
        )}
      </DialogContent>
    </Dialog>
  );
}
