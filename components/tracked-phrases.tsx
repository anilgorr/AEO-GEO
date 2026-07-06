"use client";

import { useRef, useState, useTransition } from "react";
import {
  addTrackedPhrase,
  removeTrackedPhrase,
  lockPhraseList,
} from "@/app/(dashboard)/phrases-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TrackedPhrase {
  id: string;
  phrase: string;
  locked: boolean;
}

export function TrackedPhrases({
  clientId,
  phrases,
}: {
  clientId: string;
  phrases: TrackedPhrase[];
}) {
  const [isPending, startTransition] = useTransition();
  const [value, setValue] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  const anyLocked = phrases.some((p) => p.locked);

  return (
    <Card className="border-none shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Tracked phrases</CardTitle>
        {phrases.length > 0 && !anyLocked && (
          <Button
            size="sm"
            variant="outline"
            className="rounded-full"
            disabled={isPending}
            onClick={() => startTransition(() => lockPhraseList(clientId))}
          >
            Lock list ({phrases.length})
          </Button>
        )}
        {anyLocked && (
          <span className="text-xs font-medium text-emerald-600">
            Locked for tracking
          </span>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {!anyLocked && (
          <form
            ref={formRef}
            action={(formData) => {
              const phrase = formData.get("phrase") as string;
              startTransition(async () => {
                await addTrackedPhrase(clientId, phrase);
                setValue("");
              });
            }}
            className="flex gap-2"
          >
            <Input
              name="phrase"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="e.g. best project management tool for small teams"
              className="flex-1"
            />
            <Button type="submit" size="sm" disabled={isPending}>
              Add
            </Button>
          </form>
        )}

        {phrases.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No phrases yet. Add 30-50 real conversational queries, then lock
            the list before tracking begins.
          </p>
        )}

        <ul className="space-y-1.5">
          {phrases.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-1.5 text-sm"
            >
              <span className="truncate">{p.phrase}</span>
              {!p.locked && (
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() =>
                    startTransition(() => removeTrackedPhrase(p.id))
                  }
                  className="ml-2 shrink-0 text-xs text-muted-foreground hover:text-destructive"
                >
                  Remove
                </button>
              )}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
