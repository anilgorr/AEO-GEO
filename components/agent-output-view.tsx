"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createTaskFromSuggestion } from "@/app/(dashboard)/agent-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AgentType, TaskType } from "@/lib/types";

const SEVERITY_STYLES: Record<string, string> = {
  high: "bg-red-100 text-red-800",
  medium: "bg-amber-100 text-amber-800",
  low: "bg-slate-100 text-slate-700",
};

const RISK_STYLES: Record<string, string> = {
  high: "bg-red-100 text-red-800",
  medium: "bg-amber-100 text-amber-800",
  low: "bg-emerald-100 text-emerald-800",
};

// Default task type when creating a task from an item in this agent's output.
const TASK_TYPE_BY_AGENT: Record<string, TaskType> = {
  keyword: "seo",
  onpage: "content",
  audit: "technical",
  schema: "technical",
  geo: "geo",
  offpage: "off_page",
  sitemap: "technical",
  planning: "seo",
  monitoring: "seo",
};

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="mt-4 mb-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase first:mt-0">
      {children}
    </h4>
  );
}

function CreateTaskButton({
  clientId,
  title,
  description,
  type,
}: {
  clientId: string;
  title: string;
  description: string;
  type: TaskType;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [created, setCreated] = useState(false);

  if (created) {
    return (
      <Badge
        variant="secondary"
        className="shrink-0 rounded-full bg-emerald-100 text-xs text-emerald-800"
      >
        Task created ✓
      </Badge>
    );
  }

  return (
    <Button
      size="sm"
      variant="outline"
      className="h-7 shrink-0 rounded-full text-xs"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await createTaskFromSuggestion(clientId, title, description, type);
          setCreated(true);
          router.refresh();
        })
      }
    >
      {isPending ? "Creating…" : "+ Create task"}
    </Button>
  );
}

/**
 * Renders an agent run's output. If the user has saved an edited version,
 * that text wins; otherwise the structured JSON is rendered as proper UI
 * per known agent output shape, with a readable fallback. When clientId is
 * provided, every actionable item gets a "+ Create task" button carrying
 * the full how-to (action + reasoning) into the task description.
 */
export function AgentOutputView({
  output,
  editedOutput,
  clientId,
  agentType,
}: {
  output: Record<string, unknown> | null;
  editedOutput?: string | null;
  clientId?: string | null;
  agentType?: AgentType | string;
}) {
  const defaultType: TaskType = TASK_TYPE_BY_AGENT[agentType ?? ""] ?? "seo";
  const canCreate = Boolean(clientId);

  if (editedOutput) {
    return (
      <div className="space-y-2">
        <Badge variant="outline" className="rounded-full text-xs">
          Edited by team
        </Badge>
        <div className="text-sm leading-relaxed whitespace-pre-wrap">
          {editedOutput}
        </div>
      </div>
    );
  }

  if (!output) {
    return <p className="text-sm text-muted-foreground">No output.</p>;
  }

  const o = output as Record<string, any>;
  const sections: React.ReactNode[] = [];

  if (typeof o.summary === "string" && o.summary) {
    sections.push(
      <p key="summary" className="text-sm leading-relaxed">
        {o.summary}
      </p>
    );
  }

  if (typeof o.digest === "string" && o.digest) {
    sections.push(
      <p key="digest" className="text-sm leading-relaxed">
        {o.digest}
      </p>
    );
  }

  if (typeof o.risk_level === "string") {
    sections.push(
      <div key="risk">
        <Badge
          className={`rounded-full ${RISK_STYLES[o.risk_level] ?? ""}`}
          variant="secondary"
        >
          Risk: {o.risk_level}
        </Badge>
      </div>
    );
  }

  if (typeof o.citability_score === "number") {
    sections.push(
      <div key="score" className="flex items-baseline gap-2">
        <span className="text-3xl font-bold tracking-tight">
          {o.citability_score}
        </span>
        <span className="text-sm text-muted-foreground">
          / 100 citability score
        </span>
      </div>
    );
  }

  if (Array.isArray(o.clusters) && o.clusters.length) {
    sections.push(
      <div key="clusters">
        <SectionTitle>Topic clusters</SectionTitle>
        <div className="space-y-3">
          {o.clusters.map((c: any, i: number) => (
            <div key={i} className="rounded-xl bg-muted/40 p-3">
              <div className="mb-1 flex items-center justify-between gap-2">
                <p className="text-sm font-semibold">{c.name}</p>
                <div className="flex items-center gap-2">
                  {c.priority != null && (
                    <Badge variant="secondary" className="rounded-full text-xs">
                      P{c.priority}
                    </Badge>
                  )}
                  {canCreate && (
                    <CreateTaskButton
                      clientId={clientId!}
                      title={`Create content for cluster: ${c.name}`}
                      description={[
                        c.intent ? `Intent: ${c.intent}` : null,
                        "Target queries:",
                        ...(c.queries ?? []).map((q: string) => `- ${q}`),
                      ]
                        .filter(Boolean)
                        .join("\n")}
                      type="content"
                    />
                  )}
                </div>
              </div>
              {c.intent && (
                <p className="mb-1.5 text-xs text-muted-foreground">
                  Intent: {c.intent}
                </p>
              )}
              <ul className="list-inside list-disc space-y-0.5 text-sm">
                {(c.queries ?? []).map((q: string, j: number) => (
                  <li key={j}>{q}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (Array.isArray(o.findings) && o.findings.length) {
    sections.push(
      <div key="findings">
        <SectionTitle>Findings</SectionTitle>
        <div className="space-y-2">
          {o.findings.map((f: any, i: number) => (
            <div key={i} className="rounded-xl bg-muted/40 p-3">
              <div className="mb-1 flex flex-wrap items-center gap-1.5">
                {f.severity && (
                  <Badge
                    variant="secondary"
                    className={`rounded-full text-xs ${SEVERITY_STYLES[f.severity] ?? ""}`}
                  >
                    {f.severity}
                  </Badge>
                )}
                {f.area && (
                  <Badge variant="outline" className="rounded-full text-xs">
                    {String(f.area).replace(/_/g, " ")}
                  </Badge>
                )}
                {f.needs_live_check && (
                  <Badge variant="outline" className="rounded-full text-xs">
                    needs live check
                  </Badge>
                )}
                {canCreate && (
                  <span className="ml-auto">
                    <CreateTaskButton
                      clientId={clientId!}
                      title={f.issue ?? f.finding ?? "Fix finding"}
                      description={[
                        f.issue ?? f.finding,
                        f.suggestion ? `How: ${f.suggestion}` : null,
                        f.area ? `Area: ${f.area}` : null,
                        f.needs_live_check
                          ? "Note: needs a live crawl/tool to confirm."
                          : null,
                      ]
                        .filter(Boolean)
                        .join("\n\n")}
                      type={defaultType}
                    />
                  </span>
                )}
              </div>
              <p className="text-sm">{f.issue ?? f.finding}</p>
              {f.suggestion && (
                <p className="mt-1 text-sm text-muted-foreground">
                  → {f.suggestion}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (typeof o.rewritten_opening === "string" && o.rewritten_opening) {
    sections.push(
      <div key="opening">
        <SectionTitle>Suggested opening</SectionTitle>
        <blockquote className="rounded-xl border-l-4 border-blue-500 bg-muted/40 p-3 text-sm leading-relaxed">
          {o.rewritten_opening}
        </blockquote>
      </div>
    );
  }

  if (Array.isArray(o.scoring_breakdown) && o.scoring_breakdown.length) {
    sections.push(
      <div key="breakdown">
        <SectionTitle>Scoring breakdown</SectionTitle>
        <div className="space-y-2">
          {o.scoring_breakdown.map((s: any, i: number) => (
            <div key={i}>
              <div className="mb-0.5 flex items-center justify-between text-sm">
                <span>{s.criterion}</span>
                <span className="font-medium">{s.score}/100</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${Math.min(100, s.score ?? 0)}%` }}
                />
              </div>
              {s.notes && (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {s.notes}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (Array.isArray(o.top_recommendations) && o.top_recommendations.length) {
    sections.push(
      <div key="toprecs">
        <SectionTitle>Top recommendations</SectionTitle>
        <div className="space-y-2">
          {o.top_recommendations.map((r: string, i: number) => (
            <div
              key={i}
              className="flex items-start justify-between gap-2 rounded-xl bg-muted/40 p-3"
            >
              <p className="text-sm">{r}</p>
              {canCreate && (
                <CreateTaskButton
                  clientId={clientId!}
                  title={r}
                  description={r}
                  type={defaultType}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (Array.isArray(o.recommendations) && o.recommendations.length) {
    sections.push(
      <div key="recs">
        <SectionTitle>Recommendations</SectionTitle>
        <div className="space-y-2">
          {o.recommendations.map((r: any, i: number) => (
            <div key={i} className="rounded-xl bg-muted/40 p-3">
              <div className="mb-1 flex flex-wrap items-center gap-1.5">
                {r.channel && (
                  <Badge variant="secondary" className="rounded-full text-xs">
                    {String(r.channel).replace(/_/g, " ")}
                  </Badge>
                )}
                {r.feasible === false && (
                  <Badge
                    variant="secondary"
                    className="rounded-full bg-red-100 text-xs text-red-800"
                  >
                    not feasible
                  </Badge>
                )}
                {canCreate && r.feasible !== false && (
                  <span className="ml-auto">
                    <CreateTaskButton
                      clientId={clientId!}
                      title={r.action}
                      description={[
                        `How: ${r.action}`,
                        r.reasoning ? `Why: ${r.reasoning}` : null,
                        r.channel ? `Channel: ${r.channel}` : null,
                      ]
                        .filter(Boolean)
                        .join("\n\n")}
                      type="off_page"
                    />
                  </span>
                )}
              </div>
              <p className="text-sm">{r.action}</p>
              {r.reasoning && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {r.reasoning}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (Array.isArray(o.recommended_types) && o.recommended_types.length) {
    sections.push(
      <div key="schematypes">
        <SectionTitle>Recommended schema types</SectionTitle>
        <div className="flex flex-wrap gap-1.5">
          {o.recommended_types.map((t: string, i: number) => (
            <Badge key={i} variant="secondary" className="rounded-full">
              {t}
            </Badge>
          ))}
        </div>
      </div>
    );
  }

  if (typeof o.jsonld === "string" && o.jsonld) {
    sections.push(
      <div key="jsonld">
        <div className="flex items-center justify-between">
          <SectionTitle>JSON-LD</SectionTitle>
          {canCreate && (
            <CreateTaskButton
              clientId={clientId!}
              title="Implement generated JSON-LD schema"
              description={`Add this JSON-LD to the page:\n\n${o.jsonld}`}
              type="technical"
            />
          )}
        </div>
        <pre className="max-h-64 overflow-auto rounded-xl bg-slate-950 p-3 text-xs leading-relaxed text-slate-100">
          {o.jsonld}
        </pre>
      </div>
    );
  }

  if (Array.isArray(o.recommended_structure) && o.recommended_structure.length) {
    sections.push(
      <div key="structure">
        <SectionTitle>Recommended structure</SectionTitle>
        <div className="space-y-2">
          {o.recommended_structure.map((s: any, i: number) => (
            <div key={i} className="rounded-xl bg-muted/40 p-3">
              <div className="flex items-start justify-between gap-2">
                <p className="font-mono text-sm font-medium">
                  {s.url_pattern}
                </p>
                {canCreate && (
                  <CreateTaskButton
                    clientId={clientId!}
                    title={`Build section: ${s.url_pattern}`}
                    description={[
                      `URL pattern: ${s.url_pattern}`,
                      `Purpose: ${s.purpose}`,
                      Array.isArray(s.links_to) && s.links_to.length
                        ? `Internal links to: ${s.links_to.join(", ")}`
                        : null,
                    ]
                      .filter(Boolean)
                      .join("\n")}
                    type="technical"
                  />
                )}
              </div>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {s.purpose}
              </p>
              {Array.isArray(s.links_to) && s.links_to.length > 0 && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Links to: {s.links_to.join(", ")}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (Array.isArray(o.recommended_actions) && o.recommended_actions.length) {
    sections.push(
      <div key="actions">
        <SectionTitle>Recommended actions</SectionTitle>
        <div className="space-y-2">
          {o.recommended_actions.map((a: any, i: number) => (
            <div
              key={i}
              className="flex items-start justify-between gap-2 rounded-xl bg-muted/40 p-3"
            >
              <p className="text-sm">
                {a.action}
                {a.handler && (
                  <span className="text-muted-foreground"> — {a.handler}</span>
                )}
              </p>
              {canCreate && (
                <CreateTaskButton
                  clientId={clientId!}
                  title={a.action}
                  description={[
                    a.action,
                    a.handler ? `Suggested handler: ${a.handler}` : null,
                  ]
                    .filter(Boolean)
                    .join("\n\n")}
                  type={defaultType}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (Array.isArray(o.proposed_tasks) && o.proposed_tasks.length) {
    sections.push(
      <div key="proposed">
        <SectionTitle>Proposed tasks</SectionTitle>
        <div className="space-y-2">
          {o.proposed_tasks.map((t: any, i: number) => (
            <div key={i} className="rounded-xl bg-muted/40 p-3">
              <div className="mb-1 flex items-center gap-1.5">
                <Badge variant="secondary" className="rounded-full text-xs">
                  {t.type}
                </Badge>
                {t.priority != null && (
                  <Badge variant="outline" className="rounded-full text-xs">
                    P{t.priority}
                  </Badge>
                )}
                {canCreate && (
                  <span className="ml-auto">
                    <CreateTaskButton
                      clientId={clientId!}
                      title={t.title}
                      description={[t.description, t.rationale ? `Why: ${t.rationale}` : null]
                        .filter(Boolean)
                        .join("\n\n")}
                      type={t.type ?? defaultType}
                    />
                  </span>
                )}
              </div>
              <p className="text-sm font-medium">{t.title}</p>
              {t.description && (
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {t.description}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (sections.length === 0) {
    return (
      <pre className="max-h-64 overflow-auto rounded-xl bg-muted p-3 text-xs whitespace-pre-wrap">
        {JSON.stringify(output, null, 2)}
      </pre>
    );
  }

  return <div className="space-y-3">{sections}</div>;
}
