/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Converts a structured agent output (any of the known agent JSON shapes)
 * into readable plain text. Used to prefill the edit box and to pass one
 * agent's output as the brief for another agent.
 */
export function outputToText(output: Record<string, unknown> | null): string {
  if (!output) return "";
  const o = output as Record<string, any>;
  const lines: string[] = [];

  if (typeof o.summary === "string" && o.summary) lines.push(o.summary, "");
  if (typeof o.digest === "string" && o.digest) lines.push(o.digest, "");
  if (typeof o.risk_level === "string")
    lines.push(`Risk level: ${o.risk_level}`, "");

  if (Array.isArray(o.clusters) && o.clusters.length) {
    lines.push("Topic clusters:");
    for (const c of o.clusters) {
      lines.push(`\n${c.name}${c.priority ? ` (priority ${c.priority})` : ""}`);
      if (c.intent) lines.push(`Intent: ${c.intent}`);
      for (const q of c.queries ?? []) lines.push(`- ${q}`);
    }
    lines.push("");
  }

  if (Array.isArray(o.findings) && o.findings.length) {
    lines.push("Findings:");
    for (const f of o.findings) {
      const sev = f.severity ? `[${String(f.severity).toUpperCase()}] ` : "";
      const area = f.area ? `(${f.area}) ` : "";
      lines.push(`- ${sev}${area}${f.issue ?? f.finding ?? ""}`);
      if (f.suggestion) lines.push(`  Suggestion: ${f.suggestion}`);
      if (f.needs_live_check)
        lines.push("  Needs a live crawl/tool to confirm.");
    }
    lines.push("");
  }

  if (typeof o.rewritten_opening === "string" && o.rewritten_opening) {
    lines.push("Suggested opening:", o.rewritten_opening, "");
  }

  if (Array.isArray(o.recommended_types) && o.recommended_types.length) {
    lines.push(`Recommended schema types: ${o.recommended_types.join(", ")}`, "");
  }
  if (typeof o.jsonld === "string" && o.jsonld) {
    lines.push("JSON-LD:", o.jsonld, "");
  }

  if (typeof o.citability_score === "number") {
    lines.push(`Citability score: ${o.citability_score}/100`, "");
  }
  if (Array.isArray(o.scoring_breakdown) && o.scoring_breakdown.length) {
    lines.push("Scoring breakdown:");
    for (const s of o.scoring_breakdown) {
      lines.push(`- ${s.criterion}: ${s.score}/100${s.notes ? ` — ${s.notes}` : ""}`);
    }
    lines.push("");
  }
  if (Array.isArray(o.top_recommendations) && o.top_recommendations.length) {
    lines.push("Top recommendations:");
    for (const r of o.top_recommendations) lines.push(`- ${r}`);
    lines.push("");
  }

  if (Array.isArray(o.recommendations) && o.recommendations.length) {
    lines.push("Recommendations:");
    for (const r of o.recommendations) {
      lines.push(
        `- [${r.channel ?? "general"}] ${r.action}${r.feasible === false ? " (not feasible)" : ""}`
      );
      if (r.reasoning) lines.push(`  Why: ${r.reasoning}`);
    }
    lines.push("");
  }

  if (Array.isArray(o.recommended_structure) && o.recommended_structure.length) {
    lines.push("Recommended structure:");
    for (const s of o.recommended_structure) {
      lines.push(`- ${s.url_pattern}: ${s.purpose}`);
      if (Array.isArray(s.links_to) && s.links_to.length)
        lines.push(`  Links to: ${s.links_to.join(", ")}`);
    }
    lines.push("");
  }

  if (Array.isArray(o.recommended_actions) && o.recommended_actions.length) {
    lines.push("Recommended actions:");
    for (const a of o.recommended_actions)
      lines.push(`- ${a.action}${a.handler ? ` (${a.handler})` : ""}`);
    lines.push("");
  }

  if (Array.isArray(o.proposed_tasks) && o.proposed_tasks.length) {
    lines.push("Proposed tasks:");
    for (const t of o.proposed_tasks) {
      lines.push(`- [${t.type}] ${t.title}${t.priority ? ` (priority ${t.priority})` : ""}`);
      if (t.description) lines.push(`  ${t.description}`);
      if (t.rationale) lines.push(`  Why: ${t.rationale}`);
    }
    lines.push("");
  }

  if (lines.length === 0) return JSON.stringify(output, null, 2);
  return lines.join("\n").trim();
}
