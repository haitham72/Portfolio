-- Run this once in the Supabase SQL editor (Dashboard -> SQL Editor -> New query)
-- for a BRAND NEW project. If you already ran an earlier version of this file
-- (the one where `access` was text 'limited'/'allowed'), run
-- supabase/migration_001_boolean_access.sql instead — it converts your
-- existing table and data in place rather than recreating it.
--
-- This table is written only by middleware.ts using the SERVICE ROLE key
-- (server-side, trusted code, bypasses RLS) — it's never read or written
-- from the browser, so no RLS policies are defined for anon/authenticated
-- roles. RLS is still enabled as a safety net: without a policy granting
-- access, anon/authenticated requests are denied by default even if the
-- key ever leaked into client code by mistake.

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  ip text,
  access boolean not null default false, -- false = limited (sees /preview), true = allowed (sees the real site)
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

alter table public.users enable row level security;

-- To let someone in: Table Editor -> users -> find their email -> click the
-- "access" cell -> it's a checkbox/toggle now (boolean column), not free
-- text -> check it to grant access. That's the entire admin UI — there's
-- no in-app dashboard for this by design.

-- Append-only visit log — every real page load, regardless of sign-in
-- status (runs even in PUBLIC_MODE). bigint identity, not uuid like
-- `users`: this is a log you count/aggregate, not look up rows in by id.
-- See migration_002_visits_table.sql's header for example queries.
create table if not exists public.visits (
  id bigint generated always as identity primary key,
  path text not null,
  ip text,
  user_agent text,
  created_at timestamptz not null default now()
);

alter table public.visits enable row level security;
