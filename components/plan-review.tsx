"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { approvePlanningProposals } from "@/app/(dashboard)/agent-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AGENT_LABELS, type ProposedTask } from "@/lib/types";

export function PlanReview({
  clientId,
  summary,
  proposals,
}: {
  clientId: string;
  summary: string;
  proposals: ProposedTask[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [items, setItems] = useState(
    proposals.map((p) => ({ ...p, approved: true }))
  );
  const [result, setResult] = useState<string | null>(null);

  function updateItem(index: number, patch: Partial<(typeof items)[number]>) {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...patch } : item))
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Planning Agent summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{summary}</p>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {items.map((item, i) => (
          <Card key={i} className="border-none shadow-sm">
            <CardContent className="space-y-3 pt-6">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={item.approved}
                  onChange={(e) => updateItem(i, { approved: e.target.checked })}
                  className="mt-1.5 size-4 accent-primary"
                />
                <div className="flex-1 space-y-2">
                  <Input
                    value={item.title}
                    onChange={(e) => updateItem(i, { title: e.target.value })}
                    className="font-medium"
                  />
                  <Textarea
                    value={item.description}
                    onChange={(e) =>
                      updateItem(i, { description: e.target.value })
                    }
                    rows={2}
                  />
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="rounded-full bg-muted px-2 py-1">
                      {item.type.toUpperCase()}
                    </span>
                    {item.target_agent && (
                      <span className="rounded-full bg-accent px-2 py-1 text-accent-foreground">
                        → {AGENT_LABELS[item.target_agent].label}
                      </span>
                    )}
                    <span>Priority {item.priority}</span>
                  </div>
                  <p className="text-xs text-muted-foreground italic">
                    {item.rationale}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {items.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No proposals — the baseline plan already covers this client.
          </p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Button
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              const approved = items.filter((i) => i.approved);
              const { created } = await approvePlanningProposals(
                clientId,
                approved
              );
              setResult(`Created ${created} task${created === 1 ? "" : "s"}.`);
              router.push(`/?client=${clientId}`);
            })
          }
          className="rounded-full"
        >
          {isPending ? "Creating tasks…" : "Approve selected & create tasks"}
        </Button>
        <Button
          variant="outline"
          className="rounded-full"
          onClick={() => router.push(`/?client=${clientId}`)}
        >
          Skip for now
        </Button>
        {result && <p className="text-sm text-muted-foreground">{result}</p>}
      </div>
    </div>
  );
}
