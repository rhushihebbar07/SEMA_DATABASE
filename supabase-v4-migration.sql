-- AquaDesk v4 migration
-- Run once in Supabase SQL Editor.
-- Adds individual participant -> event registration used by the Admin roster.

create table if not exists public.participant_event_participation(
  participant_id uuid not null references public.participants_public(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  participating boolean not null default true,
  updated_at timestamptz default now(),
  primary key(participant_id,event_id)
);

alter table public.participant_event_participation enable row level security;

drop policy if exists "authorised participant event read" on public.participant_event_participation;
create policy "authorised participant event read"
on public.participant_event_participation
for select to authenticated
using (public.is_authorised());

drop policy if exists "admin participant event all" on public.participant_event_participation;
create policy "admin participant event all"
on public.participant_event_participation
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

create index if not exists idx_participant_event_participant
on public.participant_event_participation(participant_id);

create index if not exists idx_participant_event_event
on public.participant_event_participation(event_id);

notify pgrst, 'reload schema';
