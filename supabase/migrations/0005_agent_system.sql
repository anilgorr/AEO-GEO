-- Agent system: agent_runs records every Planning/Monitoring/specialist
-- agent invocation. Client status/engagement_type support the onboarding
-- scenarios documented in the plan (paused/archived clients, audit-only
-- engagements).

create type agent_type as enum (
  'planning',
  'monitoring',
  'keyword',
  'onpage',
  'audit',
  'schema',
  'geo',
  'offpage',
  'sitemap'
);

create type agent_run_status as enum ('running', 'completed', 'failed');

create table public.agent_runs (
  id uuid primary key default gen_random_uuid(),
  agent_type agent_type not null,
  client_id uuid references public.clients(id) on delete cascade,
  task_id uuid references public.tasks(id) on delete set null,
  input jsonb not null default '{}'::jsonb,
  output jsonb,
  status agent_run_status not null default 'running',
  error text,
  requested_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create index agent_runs_client_idx on public.agent_runs(client_id, created_at desc);

alter table public.clients
  add column status text not null default 'active' check (status in ('active', 'paused', 'archived')),
  add column engagement_type text not null default 'ongoing' check (engagement_type in ('ongoing', 'audit_only'));

alter table public.agent_runs enable row level security;

create policy "authenticated read agent_runs" on public.agent_runs
  for select using (auth.role() = 'authenticated');
create policy "authenticated write agent_runs" on public.agent_runs
  for insert with check (auth.role() = 'authenticated');
create policy "authenticated update agent_runs" on public.agent_runs
  for update using (auth.role() = 'authenticated');
