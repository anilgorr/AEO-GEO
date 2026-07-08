"use client";

import { useState, useTransition } from "react";
import { runMonitoringAgent } from "@/app/(dashboard)/agent-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface MonitoringOutput {
  digest: string;
  risk_level: "low" | "medium" | "high";
  recommended_actions: { action: string; handler: string }[];
}

const RISK_STYLES: Record<string, string> = {
  low: "bg-emerald-100 text-emerald-800",
  medium: "bg-amber-100 text-amber-800",
  high: "bg-red-100 text-red-800",
};

export function MonitoringAgentPanel({ clientId }: { clientId: string }) {
  const [isPending, startTransition] = useTransition();
  const [output, setOutput] = useState<MonitoringOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <Card className="border-none shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Monitoring Agent</CardTitle>
        <Button
          size="sm"
          variant="outline"
          className="rounded-full"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              setError(null);
              const result = await runMonitoringAgent(clientId);
              if (result.error) setError(result.error);
              else setOutput(result.output as unknown as MonitoringOutput);
            })
          }
        >
          {isPending ? "Checking…" : "Run status check"}
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {!output && !error && (
          <p className="text-sm text-muted-foreground">
            Run a check to get a status digest across tasks and visibility
            data for this client.
          </p>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
        {output && (
          <>
            <div className="flex items-center gap-2">
              <Badge className={`rounded-full ${RISK_STYLES[output.risk_level]}`}>
                {output.risk_level} risk
              </Badge>
            </div>
            <p className="text-sm">{output.digest}</p>
            {output.recommended_actions?.length > 0 && (
              <ul className="space-y-1.5">
                {output.recommended_actions.map((a, i) => (
                  <li
                    key={i}
                    className="rounded-lg bg-muted/40 px-3 py-2 text-sm"
                  >
                    <span className="font-medium">{a.handler}:</span>{" "}
                    {a.action}
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
