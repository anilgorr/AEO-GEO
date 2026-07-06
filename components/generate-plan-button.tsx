"use client";

import { useState, useTransition } from "react";
import { generatePlanForClient } from "@/app/(dashboard)/tasks-actions";
import { Button } from "@/components/ui/button";

export function GeneratePlanButton({ clientId }: { clientId: string }) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<string | null>(null);

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        className="rounded-full"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            const { created } = await generatePlanForClient(clientId);
            setResult(
              created === 0
                ? "Plan already up to date — no new tasks."
                : `Created ${created} task${created === 1 ? "" : "s"} from the template library.`
            );
          })
        }
      >
        {isPending ? "Generating plan…" : "Generate plan"}
      </Button>
      {result && <p className="text-xs text-muted-foreground">{result}</p>}
    </div>
  );
}
