-- Human-edited version of an agent run's output. When present, it is
-- what gets displayed and what gets chained into other agents as input.
alter table public.agent_runs add column edited_output text;
