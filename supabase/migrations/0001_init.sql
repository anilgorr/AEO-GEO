-- Phase 1 schema: users/roles, clients, tasks, task templates, activity log

create type user_role as enum ('admin', 'manager', 'seo_specialist', 'content_writer', 'dev');
create type task_status as enum ('todo', 'in_progress', 'review', 'done');
create type task_type as enum ('seo', 'aeo', 'geo', 'content', 'technical', 'off_page');
create type risk_tier as enum ('routine', 'high_impact');
create type approval_state as enum ('not_required', 'pending', 'approved', 'rejected');

-- Profile table extending Supabase auth.users
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  role user_role not null default 'seo_specialist',
  telegram_chat_id text,
  created_at timestamptz not null default now()
);

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  website_url text,
  industry text,
  onboarding_answers jsonb default '{}'::jsonb,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.task_templates (
  id uuid primary key default gen_random_uuid(),
  phase text not null,
  title text not null,
  description text,
  default_type task_type not null,
  default_role user_role not null,
  default_risk_tier risk_tier not null default 'routine',
  recurring boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) on delete cascade,
  template_id uuid references public.task_templates(id),
  title text not null,
  description text,
  type task_type not null,
  status task_status not null default 'todo',
  risk_tier risk_tier not null default 'routine',
  approval_state approval_state not null default 'not_required',
  target_url text,
  target_keyword text,
  target_platform text,
  priority smallint not null default 3 check (priority between 1 and 5),
  assignee_id uuid references public.profiles(id),
  reporter_id uuid references public.profiles(id),
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.activity_log (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references public.tasks(id) on delete cascade,
  actor_id uuid references public.profiles(id),
  action text not null,
  note text,
  created_at timestamptz not null default now()
);

-- Keep updated_at current on tasks
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger tasks_set_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.task_templates enable row level security;
alter table public.tasks enable row level security;
alter table public.activity_log enable row level security;

-- Any authenticated employee can read team data; writes are open to
-- authenticated users for MVP and will be tightened to role-based
-- policies (admin/manager vs specialist) in Phase 2.
create policy "authenticated read profiles" on public.profiles
  for select using (auth.role() = 'authenticated');
create policy "self update profile" on public.profiles
  for update using (auth.uid() = id);

create policy "authenticated read clients" on public.clients
  for select using (auth.role() = 'authenticated');
create policy "authenticated write clients" on public.clients
  for insert with check (auth.role() = 'authenticated');
create policy "authenticated update clients" on public.clients
  for update using (auth.role() = 'authenticated');

create policy "authenticated read task_templates" on public.task_templates
  for select using (auth.role() = 'authenticated');

create policy "authenticated read tasks" on public.tasks
  for select using (auth.role() = 'authenticated');
create policy "authenticated write tasks" on public.tasks
  for insert with check (auth.role() = 'authenticated');
create policy "authenticated update tasks" on public.tasks
  for update using (auth.role() = 'authenticated');

create policy "authenticated read activity_log" on public.activity_log
  for select using (auth.role() = 'authenticated');
create policy "authenticated write activity_log" on public.activity_log
  for insert with check (auth.role() = 'authenticated');

-- Auto-create a profile row whenever a new auth user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email), new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
