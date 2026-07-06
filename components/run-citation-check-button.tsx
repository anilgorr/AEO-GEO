"use client";

import { useState, useTransition } from "react";
import { runCitationCheck } from "@/app/(dashboard)/citation-actions";
import { Button } from "@/components/ui/button";

export function RunCitationCheckButton({ clientId }: { clientId: string }) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        className="rounded-full"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            setMessage(null);
            try {
              const { checksWritten, phraseCount } =
                await runCitationCheck(clientId);
              setMessage(
                `Checked ${phraseCount} phrases, recorded ${checksWritten} results.`
              );
            } catch (err) {
              setMessage(err instanceof Error ? err.message : "Check failed.");
            }
          })
        }
      >
        {isPending ? "Checking…" : "Run citation check"}
      </Button>
      {message && <p className="text-xs text-muted-foreground">{message}</p>}
    </div>
  );
}
