/* eslint-disable @typescript-eslint/no-explicit-any */
import { Badge } from "@/components/ui/badge";

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

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="mt-4 mb-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase first:mt-0">
      {children}
    </h4>
  );
}

/**
 * Renders an agent run's output. If the user has saved an edited version,
 * that text wins; otherwise the structured JSON is rendered as proper UI
 * per known agent output shape, with a readable fallback.
 */
export function AgentOutputView({
  output,
  editedOutput,
}: {
  output: Record<string, unknown> | null;
  editedOutput?: string | null;
}) {
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
                {c.priority != null && (
                  <Badge variant="secondary" className="rounded-full text-xs">
                    P{c.priority}
                  </Badge>
                )}
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
        <ul className="list-inside list-disc space-y-1 text-sm">
          {o.top_recommendations.map((r: string, i: number) => (
            <li key={i}>{r}</li>
          ))}
        </ul>
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
        <SectionTitle>JSON-LD</SectionTitle>
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
              <p className="font-mono text-sm font-medium">{s.url_pattern}</p>
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
        <ul className="space-y-1.5">
          {o.recommended_actions.map((a: any, i: number) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
              <span>
                {a.action}
                {a.handler && (
                  <span className="text-muted-foreground"> — {a.handler}</span>
                )}
              </span>
            </li>
          ))}
        </ul>
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
