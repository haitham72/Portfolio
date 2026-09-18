-- Run this in the SQL Editor if you already ran the original schema.sql,
-- where `access` was text ('limited' / 'allowed'). Converts the column to
-- boolean in place — existing rows are preserved and mapped:
-- 'allowed' -> true, 'limited' -> anything else -> false.

alter table public.users
  alter column access drop default;

alter table public.users
  alter column access type boolean using (access = 'allowed');

alter table public.users
  alter column access set default false;

alter table public.users
  drop constraint if exists users_access_check;
