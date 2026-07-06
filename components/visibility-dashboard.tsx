import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CitationCheck {
  platform: "chatgpt" | "claude" | "perplexity" | "google_aio";
  cited: boolean;
  checked_at: string;
}

const TARGET_VISIBILITY = 70;
const MILESTONE_CURVE = [20, 40, 60, 70]; // % target at end of month 1-4

const PLATFORM_LABELS: Record<string, string> = {
  chatgpt: "ChatGPT",
  claude: "Claude",
  perplexity: "Perplexity",
  google_aio: "Google AI Overviews",
};

function monthsElapsed(firstCheckDate: string) {
  const days =
    (Date.now() - new Date(firstCheckDate).getTime()) / (1000 * 60 * 60 * 24);
  return Math.min(4, Math.max(1, Math.ceil(days / 30)));
}

export function VisibilityDashboard({ checks }: { checks: CitationCheck[] }) {
  if (checks.length === 0) {
    return (
      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Visibility tracker</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No citation checks yet. Lock a phrase list and run a check to see
            visibility data here.
          </p>
        </CardContent>
      </Card>
    );
  }

  const overallCited = checks.filter((c) => c.cited).length;
  const overallVisibility = Math.round((overallCited / checks.length) * 100);

  const platforms = Array.from(new Set(checks.map((c) => c.platform)));
  const perPlatform = platforms.map((platform) => {
    const platformChecks = checks.filter((c) => c.platform === platform);
    const cited = platformChecks.filter((c) => c.cited).length;
    return {
      platform,
      visibility: Math.round((cited / platformChecks.length) * 100),
      total: platformChecks.length,
    };
  });

  const firstCheckDate = checks.reduce(
    (min, c) => (c.checked_at < min ? c.checked_at : min),
    checks[0].checked_at
  );
  const month = monthsElapsed(firstCheckDate);
  const milestoneTarget = MILESTONE_CURVE[month - 1];
  const onPace = overallVisibility >= milestoneTarget;

  return (
    <Card className="border-none shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">Visibility tracker</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="mb-1 flex items-baseline justify-between">
            <span className="text-2xl font-bold tracking-tight">
              {overallVisibility}%
            </span>
            <span className="text-xs text-muted-foreground">
              target {TARGET_VISIBILITY}% by month 4
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"
              style={{ width: `${Math.min(100, overallVisibility)}%` }}
            />
          </div>
          <p
            className={`mt-1 text-xs font-medium ${onPace ? "text-emerald-600" : "text-destructive"}`}
          >
            Month {month} milestone: {milestoneTarget}% —{" "}
            {onPace ? "on pace" : "behind pace"}
          </p>
        </div>

        <div className="space-y-2">
          {perPlatform.map((p) => (
            <div key={p.platform}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="font-medium">
                  {PLATFORM_LABELS[p.platform]}
                </span>
                <span className="text-muted-foreground">
                  {p.visibility}% ({p.total} checks)
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${Math.min(100, p.visibility)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
