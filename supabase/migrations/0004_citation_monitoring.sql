-- Citation monitoring: a locked phrase list per client, and per-check
-- results across platforms/sources.

create type citation_platform as enum ('chatgpt', 'claude', 'perplexity', 'google_aio');
create type citation_source as enum ('dataforseo', 'direct_api', 'serp_scrape');

create table public.tracked_phrases (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  phrase text not null,
  locked boolean not null default false,
  created_at timestamptz not null default now(),
  unique (client_id, phrase)
);

create table public.citation_checks (
  id uuid primary key default gen_random_uuid(),
  phrase_id uuid not null references public.tracked_phrases(id) on delete cascade,
  platform citation_platform not null,
  source citation_source not null,
  cited boolean not null,
  mention_context text,
  checked_at timestamptz not null default now()
);

create index citation_checks_phrase_idx on public.citation_checks(phrase_id, checked_at desc);

alter table public.tracked_phrases enable row level security;
alter table public.citation_checks enable row level security;

create policy "authenticated read tracked_phrases" on public.tracked_phrases
  for select using (auth.role() = 'authenticated');
create policy "authenticated write tracked_phrases" on public.tracked_phrases
  for insert with check (auth.role() = 'authenticated');
create policy "authenticated update tracked_phrases" on public.tracked_phrases
  for update using (auth.role() = 'authenticated');
create policy "authenticated delete tracked_phrases" on public.tracked_phrases
  for delete using (auth.role() = 'authenticated');

create policy "authenticated read citation_checks" on public.citation_checks
  for select using (auth.role() = 'authenticated');
create policy "authenticated write citation_checks" on public.citation_checks
  for insert with check (auth.role() = 'authenticated');
