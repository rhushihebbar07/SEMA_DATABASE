-- AQUADESK V6 MIGRATION
-- Two-level attendance uses the existing participant attendance rows:
-- Level 1 (team) writes the same status to all registered members of that team.
-- Level 2 lets operators override individual participant attendance.
-- Analytics reset is a timestamp/baseline only; no colleges, participants,
-- events, registrations, schedule rows, or attendance rows are deleted.

create table if not exists public.analytics_control(
  id integer primary key check(id=1),
  reset_at timestamptz,
  updated_at timestamptz default now(),
  updated_by uuid references auth.users(id) on delete set null
);

alter table public.analytics_control enable row level security;

drop policy if exists "admin analytics control read" on public.analytics_control;
drop policy if exists "admin analytics control all" on public.analytics_control;

create policy "admin analytics control read"
on public.analytics_control for select to authenticated
using(public.is_admin());

create policy "admin analytics control all"
on public.analytics_control for all to authenticated
using(public.is_admin())
with check(public.is_admin());

insert into public.analytics_control(id,reset_at)
values(1,null)
on conflict(id) do nothing;

notify pgrst, 'reload schema';
