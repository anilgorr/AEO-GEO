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

export interface Client {
  id: string;
  name: string;
  website_url: string | null;
  industry: string | null;
  onboarding_answers?: OnboardingAnswers | null;
}

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
