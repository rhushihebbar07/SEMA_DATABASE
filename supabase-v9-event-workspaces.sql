-- ============================================================
-- AQUADESK V9 - EVENT WORKSPACES / ROLE SECURITY / WINNERS
-- Run AFTER the existing AquaDesk schema + V8 analytics SQL.
-- Safe to re-run. Does not delete business data.
-- ============================================================

-- 1. Roles
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
check(role in('authorised','event_authorised','admin'));

alter table public.profiles
add column if not exists assigned_event_id uuid references public.events(id) on delete set null;

-- 2. Authorised event account registry
create table if not exists public.authorized_event_accounts(
  email text primary key,
  display_name text not null,
  event_name text not null default '',
  assigned_event_id uuid references public.events(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.authorized_event_accounts
add column if not exists assigned_event_id uuid references public.events(id) on delete set null;
alter table public.authorized_event_accounts
add column if not exists updated_at timestamptz not null default now();

alter table public.authorized_event_accounts enable row level security;
drop policy if exists "admin event accounts all" on public.authorized_event_accounts;
create policy "admin event accounts all" on public.authorized_event_accounts
for all to authenticated using(public.is_admin()) with check(public.is_admin());
grant select,insert,update,delete on public.authorized_event_accounts to authenticated;

insert into public.authorized_event_accounts(email,display_name,event_name)
values
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
  event_name=excluded.event_name,
  updated_at=now();

-- 3. Special global technical account
insert into public.authorized_event_accounts(email,display_name,event_name)
values('TECH@NMAMIT.IN','Technical Authorised User','')
on conflict(email) do update set display_name=excluded.display_name,updated_at=now();

-- 4. Role helpers
create or replace function public.is_event_authorised()
returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.profiles where id=auth.uid() and role='event_authorised' and assigned_event_id is not null);
$$;

grant execute on function public.is_event_authorised() to authenticated;

create or replace function public.is_authorised()
returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.profiles where id=auth.uid() and role in('authorised','event_authorised','admin'));
$$;

grant execute on function public.is_authorised() to authenticated;

create or replace function public.can_manage_event(p_event_id uuid)
returns boolean language sql stable security definer set search_path=public as $$
  select public.is_admin()
      or exists(select 1 from public.profiles where id=auth.uid() and role='authorised')
      or exists(select 1 from public.profiles where id=auth.uid() and role='event_authorised' and assigned_event_id=p_event_id);
$$;

grant execute on function public.can_manage_event(uuid) to authenticated;

-- 5. Profile directory: safe fields only; needed for global chat.
drop policy if exists "profile directory read" on public.profiles;
create policy "profile directory read" on public.profiles
for select to authenticated using(true);

-- 6. Winners
create table if not exists public.event_winners(
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  participant_id uuid references public.participants_public(id) on delete set null,
  team_name text,
  placement integer not null default 1 check(placement > 0),
  note text,
  marked_by uuid references auth.users(id) on delete set null,
  marked_at timestamptz not null default now(),
  unique(event_id,placement)
);

alter table public.event_winners enable row level security;
drop policy if exists "authorised winners read" on public.event_winners;
drop policy if exists "authorised winners insert" on public.event_winners;
drop policy if exists "authorised winners update" on public.event_winners;
drop policy if exists "authorised winners delete" on public.event_winners;

create policy "authorised winners read" on public.event_winners
for select to authenticated using(public.is_authorised());
create policy "authorised winners insert" on public.event_winners
for insert to authenticated with check(public.can_manage_event(event_id));
create policy "authorised winners update" on public.event_winners
for update to authenticated using(public.can_manage_event(event_id)) with check(public.can_manage_event(event_id));
create policy "authorised winners delete" on public.event_winners
for delete to authenticated using(public.can_manage_event(event_id));

grant select,insert,update,delete on public.event_winners to authenticated;

-- 7. Event attendance: event users only their assigned event; TECH/admin all.
drop policy if exists "authorised attendance insert" on public.attendance;
drop policy if exists "authorised attendance update" on public.attendance;

create policy "authorised attendance insert" on public.attendance
for insert to authenticated with check(
  public.can_manage_event((select es.event_id from public.event_schedule es where es.id=schedule_id))
);

create policy "authorised attendance update" on public.attendance
for update to authenticated
using(public.can_manage_event((select es.event_id from public.event_schedule es where es.id=schedule_id)))
with check(public.can_manage_event((select es.event_id from public.event_schedule es where es.id=schedule_id)));

-- 8. Automatic mapping for newly-created Auth accounts.
create or replace function public.sync_event_authorised_profile()
returns trigger language plpgsql security definer set search_path=public as $$
declare
  a public.authorized_event_accounts%rowtype;
  eid uuid;
begin
  select * into a from public.authorized_event_accounts where lower(email)=lower(new.email) limit 1;
  if a.email is null then return new; end if;

  if lower(new.email)=lower('TECH@NMAMIT.IN') then
    insert into public.profiles(id,full_name,role,assigned_event_id)
    values(new.id,'Technical Authorised User','authorised',null)
    on conflict(id) do update set full_name=excluded.full_name,role='authorised',assigned_event_id=null,updated_at=now();
    return new;
  end if;

  eid := a.assigned_event_id;
  if eid is null and a.event_name <> '' then
    select id into eid from public.events where lower(name)=lower(a.event_name) limit 1;
  end if;

  insert into public.profiles(id,full_name,role,assigned_event_id)
  values(new.id,a.display_name,'event_authorised',eid)
  on conflict(id) do update set full_name=excluded.full_name,role='event_authorised',assigned_event_id=excluded.assigned_event_id,updated_at=now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_event_authorised on auth.users;
create trigger on_auth_user_event_authorised
after insert or update of email on auth.users
for each row execute function public.sync_event_authorised_profile();

-- 9. Synchronise accounts that already exist in Auth.
insert into public.profiles(id,full_name,role,assigned_event_id)
select u.id,a.display_name,'event_authorised',coalesce(a.assigned_event_id,e.id)
from auth.users u
join public.authorized_event_accounts a on lower(u.email)=lower(a.email)
left join public.events e on lower(e.name)=lower(a.event_name)
where lower(u.email) <> lower('TECH@NMAMIT.IN')
on conflict(id) do update set
 full_name=excluded.full_name,
 role='event_authorised',
 assigned_event_id=excluded.assigned_event_id,
 updated_at=now();

insert into public.profiles(id,full_name,role,assigned_event_id)
select u.id,'Technical Authorised User','authorised',null
from auth.users u where lower(u.email)=lower('TECH@NMAMIT.IN')
on conflict(id) do update set full_name=excluded.full_name,role='authorised',assigned_event_id=null,updated_at=now();

-- 10. Ensure Semaphore is the Super Admin when that Auth user exists.
insert into public.profiles(id,full_name,role,assigned_event_id)
select u.id,'Semaphore Super Admin','admin',null
from auth.users u where lower(u.email)=lower('SEMAPHORE@NMAMIT.IN')
on conflict(id) do update set full_name=excluded.full_name,role='admin',assigned_event_id=null,updated_at=now();

-- 11. Helpful indexes
create index if not exists idx_profiles_assigned_event on public.profiles(assigned_event_id);
create index if not exists idx_event_winners_event on public.event_winners(event_id);
create index if not exists idx_event_accounts_assigned_event on public.authorized_event_accounts(assigned_event_id);

notify pgrst,'reload schema';

-- 12. Verification
select u.email,p.full_name,p.role,e.name as assigned_event
from auth.users u
left join public.profiles p on p.id=u.id
left join public.events e on e.id=p.assigned_event_id
where lower(u.email) in(
 'codewave@nmamit.in','leviathan@nmamit.in','coralcanvas@nmamit.in',
 'aquabyte@nmamit.in','aquaverse@nmamit.in','megpitch@nmamit.in',
 'tidetailor@nmamit.in','submarine@nmamit.in','oceanenigma@nmamit.in',
 'abyssarena@nmamit.in','tech@nmamit.in','semaphore@nmamit.in'
)
order by u.email;

-- ============================================================
-- NOTE:
-- Force reset remains analytics-only. The application deliberately
-- does NOT apply reset_at to college_status. Therefore the
-- Confirmed / Pending / Denied chart never changes when analytics
-- are force-reset. It changes only when an admin manually changes
-- a college's status.
-- ============================================================
