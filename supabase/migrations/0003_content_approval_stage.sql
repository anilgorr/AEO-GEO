-- Content governance workflow: brief -> draft -> citability review ->
-- brand/legal review -> published. Tracked as a stage on the task itself;
-- stage changes are logged to activity_log for history.

create type content_stage as enum (
  'brief',
  'draft',
  'citability_review',
  'brand_review',
  'published'
);

alter table public.tasks
  add column content_stage content_stage;

-- Default content-type tasks to the first stage
update public.tasks set content_stage = 'brief' where type = 'content';
