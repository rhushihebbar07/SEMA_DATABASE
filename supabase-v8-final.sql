-- ============================================================
-- AQUADESK V8 - COMPLETE ANALYTICS + EVENT AUTHORISED ACCESS
-- ============================================================
-- Run this AFTER supabase.sql / existing migrations.
-- It is safe to run repeatedly.
--
-- Force Reset password: FORCE000
-- Event-account password: NMAMITMCA@2026
--
-- NOTE: Passwords are NOT stored in this SQL. Create the ten
-- Auth users in Supabase Authentication using the supplied
-- password. Their profiles are then mapped automatically.
-- ============================================================

-- ------------------------------------------------------------
-- 1) ANALYTICS CONTROL / FORCE RESET
-- ------------------------------------------------------------
create table if not exists public.analytics_control(
  id integer primary key check(id=1),
  reset_at timestamptz,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

alter table public.analytics_control enable row level security;

drop policy if exists "admin analytics control read" on public.analytics_control;
drop policy if exists "admin analytics control all" on public.analytics_control;

create policy "admin analytics control read"
on public.analytics_control
for select to authenticated
using(public.is_admin());

create policy "admin analytics control all"
on public.analytics_control
for all to authenticated
using(public.is_admin())
with check(public.is_admin());

insert into public.analytics_control(id,reset_at)
values(1,null)
on conflict(id) do nothing;

grant select,insert,update on public.analytics_control to authenticated;
grant all on public.analytics_control to service_role;

create or replace function public.get_analytics_reset_at()
returns timestamptz
language sql
stable
security definer
set search_path=public
as $$
  select reset_at from public.analytics_control where id=1;
$$;

grant execute on function public.get_analytics_reset_at() to authenticated;

create or replace function public.force_reset_analytics(reset_password text)
returns boolean
language plpgsql
security definer
set search_path=public
as $$
begin
  if not public.is_admin() then
    raise exception 'Only Super Admin can reset analytics';
  end if;

  if reset_password <> 'FORCE000' then
    raise exception 'Invalid force reset password';
  end if;

  update public.analytics_control
  set reset_at=now(),
      updated_at=now(),
      updated_by=auth.uid()
  where id=1;

  return true;
end;
$$;

grant execute on function public.force_reset_analytics(text) to authenticated;

-- ------------------------------------------------------------
-- 2) EVENT AUTHORISED USER PROFILE FIELDS
-- ------------------------------------------------------------
alter table public.profiles
  add column if not exists assigned_event_id uuid references public.events(id) on delete set null;

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check
  check(role in('authorised','event_authorised','admin'));

-- ------------------------------------------------------------
-- 3) EVENT ACCOUNT MAPPING
-- ------------------------------------------------------------
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

grant select,insert,update,delete on public.authorized_event_accounts to authenticated;
grant all on public.authorized_event_accounts to service_role;

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

-- ------------------------------------------------------------
-- 4) ROLE FUNCTIONS
-- ------------------------------------------------------------
create or replace function public.is_authorised()
returns boolean
language sql
stable
security definer
set search_path=public
as $$
  select exists(
    select 1 from public.profiles
    where id=auth.uid()
      and role in('authorised','event_authorised','admin')
  );
$$;

grant execute on function public.is_authorised() to authenticated;

create or replace function public.is_event_authorised()
returns boolean
language sql
stable
security definer
set search_path=public
as $$
  select exists(
    select 1 from public.profiles
    where id=auth.uid()
      and role='event_authorised'
      and assigned_event_id is not null
  );
$$;

grant execute on function public.is_event_authorised() to authenticated;

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
      select 1 from public.profiles
      where id=auth.uid() and role='authorised'
    )
    or exists(
      select 1 from public.profiles
      where id=auth.uid()
        and role='event_authorised'
        and assigned_event_id=p_event_id
    );
$$;

grant execute on function public.can_mark_event(uuid) to authenticated;

-- ------------------------------------------------------------
-- 5) ATTENDANCE WRITE SECURITY
-- Event-authorised users can ONLY write attendance belonging
-- to their assigned event. Admin and legacy authorised users
-- keep their existing all-event attendance ability.
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- 6) AUTOMATIC PROFILE MAPPING FOR AUTH USERS
-- ------------------------------------------------------------
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

-- Map any users that already exist in Auth.
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

notify pgrst, 'reload schema';

-- ------------------------------------------------------------
-- 7) VERIFICATION
-- ------------------------------------------------------------
select
  p.email,
  p.full_name,
  p.role,
  e.name as assigned_event
from public.profiles p
left join public.events e on e.id=p.assigned_event_id
where p.role='event_authorised'
order by p.email;

select id,reset_at,updated_at,updated_by
from public.analytics_control
where id=1;
