-- ============================================================
-- AQUADESK V7 - EVENT AUTHORISED USERS
-- ============================================================
-- Event-authorised accounts can:
--   * view all public/private AquaDesk data allowed to signed-in users
--   * use the global realtime chat
--   * mark attendance ONLY for their assigned event
-- They cannot edit colleges, participants, events, schedules,
-- registrations, participation mappings, or other admin data.
--
-- PASSWORDS ARE NOT STORED IN THIS TABLE.
-- Create the Auth users in Supabase Authentication first using
-- the password supplied by the project owner, then this script
-- automatically maps them to the correct event profile.
-- ============================================================

create extension if not exists pgcrypto;

-- 1. Extend profiles with event assignment.
alter table public.profiles
  add column if not exists assigned_event_id uuid references public.events(id) on delete set null;

alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check
  check(role in('authorised','event_authorised','admin'));

-- 2. Account-to-event mapping. No passwords are stored here.
create table if not exists public.authorized_event_accounts(
  email text primary key,
  display_name text not null,
  event_name text not null,
  created_at timestamptz not null default now()
);

alter table public.authorized_event_accounts enable row level security;

drop policy if exists "admin event accounts all" on public.authorized_event_accounts;
create policy "admin event accounts all"
on public.authorized_event_accounts
for all to authenticated
using(public.is_admin())
with check(public.is_admin());

grant select, insert, update, delete on public.authorized_event_accounts to authenticated;
grant all on public.authorized_event_accounts to service_role;

-- 3. Seed the ten event accounts.
insert into public.authorized_event_accounts(email,display_name,event_name) values
('CODEWAVE@NMAMIT.IN','CodeWave Event Account','CodeWave'),
('LEVIATHAN@NMAMIT.IN','Leviathan Event Account','Leviathan'),
('CORALCANVAS@NMAMIT.IN','Coral Canvas Event Account','Coral Canvas'),
('AQUABYTE@NMAMIT.IN','Aqua Byte Event Account','Aqua Byte'),
('AQUAVERSE@NMAMIT.IN','Aquaverse Event Account','Aquaverse'),
('MEGPITCH@NMAMIT.IN','The Mega Pitch Event Account','The Mega Pitch'),
('TIDETAILOR@NMAMIT.IN','Tide & Tailor Event Account','Tide & Tailor'),
('SUBMARINE@NMAMIT.IN','Submarine Event Account','Submarine'),
('OCEANENIGMA@NMAMIT.IN','Ocean Enigma Event Account','Ocean Enigma'),
('ABYSSARENA@NMAMIT.IN','Abyss Arena Event Account','Abyss Arena')
on conflict(email) do update set
  display_name=excluded.display_name,
  event_name=excluded.event_name;

-- 4. Event-authorised role helpers.
create or replace function public.is_event_authorised()
returns boolean
language sql
stable
security definer
set search_path=public
as $$
  select exists(
    select 1
    from public.profiles
    where id=auth.uid()
      and role='event_authorised'
      and assigned_event_id is not null
  );
$$;

create or replace function public.can_mark_event(p_event_id uuid)
returns boolean
language sql
stable
security definer
set search_path=public
as $$
  select
    public.is_admin()
    or exists(
      select 1
      from public.profiles
      where id=auth.uid()
        and role='authorised'
    )
    or exists(
      select 1
      from public.profiles
      where id=auth.uid()
        and role='event_authorised'
        and assigned_event_id=p_event_id
    );
$$;

grant execute on function public.is_event_authorised() to authenticated;
grant execute on function public.can_mark_event(uuid) to authenticated;

-- 5. Rebuild attendance write policies with event-level enforcement.
drop policy if exists "authorised attendance insert" on public.attendance;
drop policy if exists "authorised attendance update" on public.attendance;
drop policy if exists "event authorised attendance insert" on public.attendance;
drop policy if exists "event authorised attendance update" on public.attendance;

create policy "authorised attendance insert"
on public.attendance
for insert to authenticated
with check(
  public.can_mark_event(
    (select es.event_id from public.event_schedule es where es.id=schedule_id)
  )
);

create policy "authorised attendance update"
on public.attendance
for update to authenticated
using(
  public.can_mark_event(
    (select es.event_id from public.event_schedule es where es.id=schedule_id)
  )
)
with check(
  public.can_mark_event(
    (select es.event_id from public.event_schedule es where es.id=schedule_id)
  )
);

-- 6. Sync any Auth users that already exist.
insert into public.profiles(id,full_name,role,assigned_event_id)
select
  u.id,
  a.display_name,
  'event_authorised',
  e.id
from auth.users u
join public.authorized_event_accounts a
  on lower(u.email)=lower(a.email)
join public.events e
  on lower(e.name)=lower(a.event_name)
on conflict(id) do update set
  full_name=excluded.full_name,
  role='event_authorised',
  assigned_event_id=excluded.assigned_event_id,
  updated_at=now();

-- 7. Trigger: whenever one of the Auth accounts is created,
-- automatically create/update its event-authorised profile.
create or replace function public.sync_event_authorised_profile()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
declare
  mapped public.authorized_event_accounts%rowtype;
  event_id_value uuid;
begin
  select * into mapped
  from public.authorized_event_accounts
  where lower(email)=lower(new.email)
  limit 1;

  if mapped.email is null then
    return new;
  end if;

  select id into event_id_value
  from public.events
  where lower(name)=lower(mapped.event_name)
  limit 1;

  if event_id_value is null then
    return new;
  end if;

  insert into public.profiles(id,full_name,role,assigned_event_id)
  values(new.id,mapped.display_name,'event_authorised',event_id_value)
  on conflict(id) do update set
    full_name=excluded.full_name,
    role='event_authorised',
    assigned_event_id=excluded.assigned_event_id,
    updated_at=now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_event_authorised on auth.users;
create trigger on_auth_user_event_authorised
after insert or update of email on auth.users
for each row execute function public.sync_event_authorised_profile();

-- 8. Keep private signed-in reads available to event accounts.
-- Existing is_authorised() is updated to include event_authorised.
create or replace function public.is_authorised()
returns boolean
language sql
stable
security definer
set search_path=public
as $$
 select exists(
   select 1
   from public.profiles
   where id=auth.uid()
     and role in('authorised','event_authorised','admin')
 );
$$;

grant execute on function public.is_authorised() to authenticated;

notify pgrst, 'reload schema';

-- 9. Verification: after Auth users are created, this should show all mapped accounts.
select
  p.email,
  p.full_name,
  p.role,
  e.name as assigned_event
from public.profiles p
left join public.events e on e.id=p.assigned_event_id
where p.role='event_authorised'
order by p.email;
