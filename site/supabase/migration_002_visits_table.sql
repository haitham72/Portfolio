-- Run this once in the Supabase SQL editor to add visit logging to an
-- existing project (one that already ran schema.sql / migration_001).
-- Adds a new `visits` table only — doesn't touch `users`.
--
-- Written by middleware.ts on every real page load (email/access aside —
-- runs even in PUBLIC_MODE), so you can answer "how many times has this
-- been looked at" with plain SQL instead of just "who currently has
-- access." bigint identity, not uuid like `users` — this is an
-- append-only log, not a table you look up individual rows in by id.

create table if not exists public.visits (
  id bigint generated always as identity primary key,
  path text not null,
  ip text,
  user_agent text,
  created_at timestamptz not null default now()
);

alter table public.visits enable row level security;

-- Written only by middleware.ts using the SERVICE ROLE key (server-side,
-- bypasses RLS) — same rationale as `users`: no policies means anon/
-- authenticated API requests are denied by default even if the key ever
-- leaked into client code by mistake. Query it yourself via the SQL
-- Editor (runs with full access, RLS doesn't apply there), e.g.:
--
--   select count(*) from public.visits;
--   select path, count(*) from public.visits group by path order by count(*) desc;
--   select date_trunc('day', created_at) as day, count(*) from public.visits group by 1 order by 1 desc;
