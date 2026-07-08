export type UserRole =
  | "admin"
  | "manager"
  | "seo_specialist"
  | "content_writer"
  | "dev";

export type TaskStatus = "todo" | "in_progress" | "review" | "done";

export type TaskType =
  | "seo"
  | "aeo"
  | "geo"
  | "content"
  | "technical"
  | "off_page";

export type RiskTier = "routine" | "high_impact";

export type ApprovalState = "not_required" | "pending" | "approved" | "rejected";

export type ContentStage =
  | "brief"
  | "draft"
  | "citability_review"
  | "brand_review"
  | "published";

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  telegram_chat_id: string | null;
}

export interface OnboardingAnswers {
  geography: "local" | "national" | "global" | null;
  primary_goal: "traffic" | "leads" | "sales" | "ai_visibility" | null;
  platform_priority: string[];
  competitors: string | null;
  has_press_coverage: boolean;
  has_smes_for_eeat: boolean;
  notes: string | null;
}

export type ClientStatus = "active" | "paused" | "archived";
export type EngagementType = "ongoing" | "audit_only";

export interface Client {
  id: string;
  name: string;
  website_url: string | null;
  industry: string | null;
  status: ClientStatus;
  engagement_type: EngagementType;
  onboarding_answers?: OnboardingAnswers | null;
}

export type AgentType =
  | "planning"
  | "monitoring"
  | "keyword"
  | "onpage"
  | "audit"
  | "schema"
  | "geo"
  | "offpage"
  | "sitemap";

export type AgentRunStatus = "running" | "completed" | "failed";

export interface ProposedTask {
  title: string;
  description: string;
  type: TaskType;
  target_agent: AgentType | null;
  rationale: string;
  priority: number;
}

export interface PlanningAgentOutput {
  summary: string;
  proposed_tasks: ProposedTask[];
}

export interface AgentRun {
  id: string;
  agent_type: AgentType;
  client_id: string | null;
  task_id: string | null;
  input: Record<string, unknown>;
  output: PlanningAgentOutput | Record<string, unknown> | null;
  edited_output: string | null;
  status: AgentRunStatus;
  error: string | null;
  requested_by: string | null;
  created_at: string;
}

export const AGENT_LABELS: Record<AgentType, { label: string; description: string }> = {
  planning: { label: "Planning Agent", description: "Reviews client state and proposes a prioritized task list" },
  monitoring: { label: "Monitoring Agent", description: "Reviews progress and visibility data, produces a status digest" },
  keyword: { label: "Keyword Agent", description: "Seed expansion, topic clustering, prioritization" },
  onpage: { label: "On-Page Agent", description: "Citability review and content rewrite suggestions" },
  audit: { label: "Audit Agent", description: "Technical crawl/index/Core Web Vitals audit" },
  schema: { label: "Schema Agent", description: "Structured data generation and validation" },
  geo: { label: "GEO/Citation Agent", description: "Citability scoring and AI-visibility diagnosis" },
  offpage: { label: "Off-Page/Entity Agent", description: "Brand entity-building recommendations" },
  sitemap: { label: "Sitemap Agent", description: "Site structure and internal linking recommendations" },
};

export interface Task {
  id: string;
  client_id: string | null;
  title: string;
  description: string | null;
  type: TaskType;
  status: TaskStatus;
  risk_tier: RiskTier;
  approval_state: ApprovalState;
  target_url: string | null;
  target_keyword: string | null;
  target_platform: string | null;
  priority: number;
  assignee_id: string | null;
  reporter_id: string | null;
  due_date: string | null;
  created_at: string;
  content_stage: ContentStage | null;
  clients?: Client | null;
  assignee?: Profile | null;
}

export const TASK_STATUSES: { value: TaskStatus; label: string }[] = [
  { value: "todo", label: "To Do" },
  { value: "in_progress", label: "In Progress" },
  { value: "review", label: "Review" },
  { value: "done", label: "Done" },
];

export const TASK_TYPES: { value: TaskType; label: string }[] = [
  { value: "seo", label: "SEO" },
  { value: "aeo", label: "AEO" },
  { value: "geo", label: "GEO" },
  { value: "content", label: "Content" },
  { value: "technical", label: "Technical" },
  { value: "off_page", label: "Off-page" },
];

export const CONTENT_STAGES: { value: ContentStage; label: string }[] = [
  { value: "brief", label: "Brief" },
  { value: "draft", label: "Draft" },
  { value: "citability_review", label: "Citability review" },
  { value: "brand_review", label: "Brand/legal review" },
  { value: "published", label: "Published" },
];
