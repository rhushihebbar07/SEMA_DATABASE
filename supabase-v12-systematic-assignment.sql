-- ============================================================
-- AQUADESK V12 - SYSTEMATIC EVENT ACCOUNT ASSIGNMENT
-- ============================================================
-- Run after the existing AquaDesk schema/migrations.
-- Safe: no colleges, participants, registrations, attendance,
-- schedules, or college confirmation statuses are deleted/reset.
--
-- Event account password (create in Supabase Auth):
-- NMAMITMCA@2026
--
-- Analytics reset password remains: FORCE000
-- ============================================================

-- 1) PROFILE ASSIGNMENT SUPPORT
alter table public.profiles
  add column if not exists assigned_event_id uuid references public.events(id) on delete set null;

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
check (role in ('authorised','event_authorised','admin'));

-- 2) AUTHORISED ACCOUNT REGISTRY
create table if not exists public.authorized_event_accounts (
  email text primary key,
  display_name text not null default '',
  event_name text not null default '',
  actual_event_name text not null default '',
  assigned_event_id uuid references public.events(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.authorized_event_accounts add column if not exists display_name text not null default '';
alter table public.authorized_event_accounts add column if not exists event_name text not null default '';
alter table public.authorized_event_accounts add column if not exists actual_event_name text not null default '';
alter table public.authorized_event_accounts add column if not exists assigned_event_id uuid references public.events(id) on delete set null;
alter table public.authorized_event_accounts add column if not exists created_at timestamptz not null default now();
alter table public.authorized_event_accounts add column if not exists updated_at timestamptz not null default now();

insert into public.authorized_event_accounts(email,display_name,event_name,actual_event_name)
values
('CODEWAVE@NMAMIT.IN','CodeWave Event Account','CodeWave','Coding'),
('LEVIATHAN@NMAMIT.IN','Leviathan Event Account','Leviathan','IT Manager'),
('CORALCANVAS@NMAMIT.IN','Coral Canvas Event Account','Coral Canvas','Web Design'),
('AQUABYTE@NMAMIT.IN','Aqua Byte Event Account','Aqua Byte','IT Quiz'),
('AQUAVERSE@NMAMIT.IN','Aquaverse Event Account','Aquaverse','Tech Talk'),
('MEGPITCH@NMAMIT.IN','The Mega Pitch Event Account','The Mega Pitch','Startup Event'),
('TIDETAILOR@NMAMIT.IN','Tide & Tailor Event Account','Tide & Tailor','Fashion Show'),
('SUBMARINE@NMAMIT.IN','Submarine Event Account','Submarine','Photography & Videography'),
('OCEANENIGMA@NMAMIT.IN','Ocean Enigma Event Account','Ocean Enigma','Surprise Event'),
('ABYSSARENA@NMAMIT.IN','Abyss Arena Event Account','Abyss Arena','Gaming / BGMI'),
('TECH@NMAMIT.IN','Technical Authorised User','TECH','All Events')
on conflict(email) do update set
  display_name=coalesce(nullif(excluded.display_name,''),public.authorized_event_accounts.display_name),
  event_name=coalesce(nullif(excluded.event_name,''),public.authorized_event_accounts.event_name),
  actual_event_name=coalesce(nullif(excluded.actual_event_name,''),public.authorized_event_accounts.actual_event_name),
  updated_at=now();

-- 3) RLS FOR ACCOUNT REGISTRY
alter table public.authorized_event_accounts enable row level security;
drop policy if exists "admin event accounts all" on public.authorized_event_accounts;
drop policy if exists "admin authorised accounts all" on public.authorized_event_accounts;
create policy "admin event accounts all"
on public.authorized_event_accounts for all to authenticated
using (public.is_admin()) with check (public.is_admin());
grant select,insert,update,delete on public.authorized_event_accounts to authenticated;
grant all on public.authorized_event_accounts to service_role;

-- 4) ROLE / ACCESS HELPERS
create or replace function public.current_role()
returns text language sql stable security definer set search_path=public as $$
  select role from public.profiles where id=auth.uid() limit 1;
$$;
grant execute on function public.current_role() to authenticated;

create or replace function public.current_assigned_event_id()
returns uuid language sql stable security definer set search_path=public as $$
  select assigned_event_id from public.profiles
  where id=auth.uid() and role='event_authorised' limit 1;
$$;
grant execute on function public.current_assigned_event_id() to authenticated;

create or replace function public.is_event_authorised()
returns boolean language sql stable security definer set search_path=public as $$
  select exists(
    select 1 from public.profiles
    where id=auth.uid() and role='event_authorised' and assigned_event_id is not null
  );
$$;
grant execute on function public.is_event_authorised() to authenticated;

create or replace function public.is_authorised()
returns boolean language sql stable security definer set search_path=public as $$
  select exists(
    select 1 from public.profiles
    where id=auth.uid() and role in ('authorised','event_authorised','admin')
  );
$$;
grant execute on function public.is_authorised() to authenticated;

create or replace function public.can_view_event(p_event_id uuid)
returns boolean language sql stable security definer set search_path=public as $$
  select public.is_admin()
      or exists(select 1 from public.profiles where id=auth.uid() and role='authorised')
      or exists(select 1 from public.profiles where id=auth.uid() and role='event_authorised' and assigned_event_id=p_event_id);
$$;
grant execute on function public.can_view_event(uuid) to authenticated;

create or replace function public.can_manage_event(p_event_id uuid)
returns boolean language sql stable security definer set search_path=public as $$
  select public.is_admin()
      or exists(select 1 from public.profiles where id=auth.uid() and role='authorised')
      or exists(select 1 from public.profiles where id=auth.uid() and role='event_authorised' and assigned_event_id=p_event_id);
$$;
grant execute on function public.can_manage_event(uuid) to authenticated;

-- 5) EVENT ACCOUNT -> PARTICIPANT ISOLATION
-- Remove old participant policies, including the original public policy.
alter table public.participants_public enable row level security;
drop policy if exists "public participants read" on public.participants_public;
drop policy if exists "public participants read" on public.participants_public;
drop policy if exists "authorised participants read" on public.participants_public;
drop policy if exists "staff all participants read" on public.participants_public;
drop policy if exists "assigned event participants read" on public.participants_public;
drop policy if exists "admin participants all" on public.participants_public;

create policy "staff all participants read"
on public.participants_public for select to authenticated
using (public.is_admin() or public.current_role()='authorised');

create policy "assigned event participants read"
on public.participants_public for select to authenticated
using (
  public.is_event_authorised()
  and exists (
    select 1 from public.participant_event_participation pep
    where pep.participant_id=participants_public.id
      and pep.participating=true
      and pep.event_id=public.current_assigned_event_id()
  )
);

create policy "admin participants all"
on public.participants_public for all to authenticated
using (public.is_admin()) with check (public.is_admin());

-- Participant/event registration: event users see only their assigned event.
alter table public.participant_event_participation enable row level security;
drop policy if exists "public participant event read" on public.participant_event_participation;
drop policy if exists "authorised participant event read" on public.participant_event_participation;
drop policy if exists "staff participant event read" on public.participant_event_participation;
drop policy if exists "assigned event participant event read" on public.participant_event_participation;
drop policy if exists "admin participant event all" on public.participant_event_participation;

create policy "staff participant event read"
on public.participant_event_participation for select to authenticated
using (public.is_admin() or public.current_role()='authorised');

create policy "assigned event participant event read"
on public.participant_event_participation for select to authenticated
using (public.is_event_authorised() and event_id=public.current_assigned_event_id());

create policy "admin participant event all"
on public.participant_event_participation for all to authenticated
using (public.is_admin()) with check (public.is_admin());

-- 6) COLLEGE DETAILS FOR EVENT WORKSPACE
-- A college is visible to an event operator if at least one participant
-- from that college is registered for that assigned event. The old
-- college-event matrix is NOT required to make a participant visible.
alter table public.college_contacts enable row level security;
alter table public.college_status enable row level security;

drop policy if exists "authorised contacts read" on public.college_contacts;
drop policy if exists "staff college contacts read" on public.college_contacts;
drop policy if exists "assigned college contacts read" on public.college_contacts;
drop policy if exists "admin contacts all" on public.college_contacts;
create policy "staff college contacts read"
on public.college_contacts for select to authenticated
using (public.is_admin() or public.current_role()='authorised');
create policy "assigned college contacts read"
on public.college_contacts for select to authenticated
using (
  public.is_event_authorised()
  and exists (
    select 1
    from public.participants_public p
    join public.participant_event_participation pep on pep.participant_id=p.id
    where p.college_id=college_contacts.college_id
      and pep.event_id=public.current_assigned_event_id()
      and pep.participating=true
  )
);
create policy "admin contacts all"
on public.college_contacts for all to authenticated
using (public.is_admin()) with check (public.is_admin());

drop policy if exists "authorised status read" on public.college_status;
drop policy if exists "staff college status read" on public.college_status;
drop policy if exists "assigned college status read" on public.college_status;
drop policy if exists "admin status all" on public.college_status;
create policy "staff college status read"
on public.college_status for select to authenticated
using (public.is_admin() or public.current_role()='authorised');
create policy "assigned college status read"
on public.college_status for select to authenticated
using (
  public.is_event_authorised()
  and exists (
    select 1
    from public.participants_public p
    join public.participant_event_participation pep on pep.participant_id=p.id
    where p.college_id=college_status.college_id
      and pep.event_id=public.current_assigned_event_id()
      and pep.participating=true
  )
);
create policy "admin status all"
on public.college_status for all to authenticated
using (public.is_admin()) with check (public.is_admin());

-- Participant private contacts follow the same event registration rule.
alter table public.participant_contacts enable row level security;
drop policy if exists "authorised participant contacts read" on public.participant_contacts;
drop policy if exists "staff participant contacts read" on public.participant_contacts;
drop policy if exists "assigned participant contacts read" on public.participant_contacts;
drop policy if exists "admin participant contacts all" on public.participant_contacts;
create policy "staff participant contacts read"
on public.participant_contacts for select to authenticated
using (public.is_admin() or public.current_role()='authorised');
create policy "assigned participant contacts read"
on public.participant_contacts for select to authenticated
using (
  public.is_event_authorised()
  and exists (
    select 1 from public.participant_event_participation pep
    where pep.participant_id=participant_contacts.participant_id
      and pep.event_id=public.current_assigned_event_id()
      and pep.participating=true
  )
);
create policy "admin participant contacts all"
on public.participant_contacts for all to authenticated
using (public.is_admin()) with check (public.is_admin());

-- 7) EVENT-ONLY ATTENDANCE
alter table public.attendance enable row level security;
drop policy if exists "authorised attendance read" on public.attendance;
drop policy if exists "event attendance read" on public.attendance;
drop policy if exists "authorised attendance insert" on public.attendance;
drop policy if exists "event attendance insert" on public.attendance;
drop policy if exists "authorised attendance update" on public.attendance;
drop policy if exists "event attendance update" on public.attendance;
drop policy if exists "admin attendance all" on public.attendance;

create policy "event attendance read"
on public.attendance for select to authenticated
using (
  public.can_view_event((select es.event_id from public.event_schedule es where es.id=attendance.schedule_id))
);

create policy "event attendance insert"
on public.attendance for insert to authenticated
with check (
  public.can_manage_event((select es.event_id from public.event_schedule es where es.id=attendance.schedule_id))
  and exists (
    select 1 from public.participant_event_participation pep
    where pep.participant_id=attendance.participant_id
      and pep.participating=true
      and pep.event_id=(select es.event_id from public.event_schedule es where es.id=attendance.schedule_id)
  )
);

create policy "event attendance update"
on public.attendance for update to authenticated
using (public.can_manage_event((select es.event_id from public.event_schedule es where es.id=attendance.schedule_id)))
with check (
  public.can_manage_event((select es.event_id from public.event_schedule es where es.id=attendance.schedule_id))
  and exists (
    select 1 from public.participant_event_participation pep
    where pep.participant_id=attendance.participant_id
      and pep.participating=true
      and pep.event_id=(select es.event_id from public.event_schedule es where es.id=attendance.schedule_id)
  )
);

create policy "admin attendance all"
on public.attendance for all to authenticated
using (public.is_admin()) with check (public.is_admin());

-- 8) WINNERS
create table if not exists public.event_winners (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  participant_id uuid references public.participants_public(id) on delete set null,
  team_name text,
  placement integer not null default 1 check (placement>0),
  note text,
  marked_by uuid references auth.users(id) on delete set null,
  marked_at timestamptz not null default now(),
  unique(event_id,placement)
);

-- Frontend winner upsert uses ON CONFLICT (event_id, placement).
create unique index if not exists event_winners_event_placement_unique
on public.event_winners(event_id, placement);

alter table public.event_winners enable row level security;
drop policy if exists "authorised winners read" on public.event_winners;
drop policy if exists "event winners read" on public.event_winners;
drop policy if exists "authorised winners insert" on public.event_winners;
drop policy if exists "event winners insert" on public.event_winners;
drop policy if exists "authorised winners update" on public.event_winners;
drop policy if exists "event winners update" on public.event_winners;
drop policy if exists "authorised winners delete" on public.event_winners;
drop policy if exists "event winners delete" on public.event_winners;
create policy "event winners read" on public.event_winners for select to authenticated using(public.can_view_event(event_id));
create policy "event winners insert" on public.event_winners for insert to authenticated with check(public.can_manage_event(event_id));
create policy "event winners update" on public.event_winners for update to authenticated using(public.can_manage_event(event_id)) with check(public.can_manage_event(event_id));
create policy "event winners delete" on public.event_winners for delete to authenticated using(public.can_manage_event(event_id));
grant select,insert,update,delete on public.event_winners to authenticated;

-- 9) ADMIN MANUAL ASSIGNMENT
-- Selecting an event in Super Admin updates BOTH the account registry
-- and the Auth user's profile, so the designated login gets the workspace.
create or replace function public.assign_authorized_event(p_email text,p_event_id uuid)
returns boolean
language plpgsql security definer set search_path=public as $$
declare
  target_user uuid;
  target_event_name text;
  account_event_name text;
  account_actual_name text;
begin
  if not public.is_admin() then
    raise exception 'Only Super Admin can assign authorised event accounts';
  end if;

  if lower(p_email)=lower('TECH@NMAMIT.IN') then
    if p_event_id is not null then
      raise exception 'TECH is global and cannot be assigned to one event';
    end if;
  end if;

  select id into target_user from auth.users where lower(email)=lower(p_email) limit 1;
  select name into target_event_name from public.events where id=p_event_id limit 1;

  if p_event_id is not null and target_event_name is null then
    raise exception 'Selected event does not exist';
  end if;

  select event_name,actual_event_name
  into account_event_name,account_actual_name
  from public.authorized_event_accounts
  where lower(email)=lower(p_email)
  limit 1;

  if account_event_name is null and lower(p_email)<>lower('TECH@NMAMIT.IN') then
    raise exception 'Authorised account is not registered';
  end if;

  update public.authorized_event_accounts
  set assigned_event_id=p_event_id,
      updated_at=now()
  where lower(email)=lower(p_email);

  if not found then
    raise exception 'Authorised account is not registered';
  end if;

  if target_user is not null then
    if lower(p_email)=lower('TECH@NMAMIT.IN') then
      insert into public.profiles(id,full_name,role,assigned_event_id)
      values(target_user,'Technical Authorised User','authorised',null)
      on conflict(id) do update set full_name=excluded.full_name,role='authorised',assigned_event_id=null,updated_at=now();
    else
      insert into public.profiles(id,full_name,role,assigned_event_id)
      values(target_user,coalesce(account_event_name,target_event_name),'event_authorised',p_event_id)
      on conflict(id) do update set full_name=excluded.full_name,role='event_authorised',assigned_event_id=p_event_id,updated_at=now();
    end if;
  end if;

  perform public.write_audit(
    'assign_authorized_event','authorized_event_account',null,
    jsonb_build_object('email',upper(p_email),'event_id',p_event_id,'event_name',target_event_name,'actual_event',account_actual_name)
  );

  return true;
end;
$$;
grant execute on function public.assign_authorized_event(text,uuid) to authenticated;

-- 10) SYNC EXISTING AUTH USERS WITHOUT CREATING AUTH USERS
insert into public.profiles(id,full_name,role,assigned_event_id)
select u.id,a.display_name,'event_authorised',a.assigned_event_id
from auth.users u
join public.authorized_event_accounts a on lower(u.email)=lower(a.email)
where lower(u.email)<>lower('TECH@NMAMIT.IN')
  and lower(u.email)<>lower('SEMAPHORE@NMAMIT.IN')
on conflict(id) do update set
  full_name=excluded.full_name,
  role='event_authorised',
  assigned_event_id=excluded.assigned_event_id,
  updated_at=now();

insert into public.profiles(id,full_name,role,assigned_event_id)
select u.id,'Technical Authorised User','authorised',null
from auth.users u where lower(u.email)=lower('TECH@NMAMIT.IN')
on conflict(id) do update set full_name=excluded.full_name,role='authorised',assigned_event_id=null,updated_at=now();

insert into public.profiles(id,full_name,role,assigned_event_id)
select u.id,'Semaphore Super Admin','admin',null
from auth.users u where lower(u.email)=lower('SEMAPHORE@NMAMIT.IN')
on conflict(id) do update set full_name=excluded.full_name,role='admin',assigned_event_id=null,updated_at=now();

-- 11) INDEXES
create index if not exists idx_profiles_assigned_event on public.profiles(assigned_event_id);
create index if not exists idx_authorized_accounts_assigned_event on public.authorized_event_accounts(assigned_event_id);
create index if not exists idx_pep_event_participant on public.participant_event_participation(event_id,participant_id,participating);
create index if not exists idx_attendance_schedule_participant on public.attendance(schedule_id,participant_id);

-- 12) VERIFY - THESE SHOULD ALWAYS SHOW ALL 11 ACCOUNTS
select email,display_name,event_name,actual_event_name,assigned_event_id
from public.authorized_event_accounts
order by email;

-- Verify actual Auth users that already exist.
select u.email,p.full_name,p.role,p.assigned_event_id,e.name as assigned_database_event
from auth.users u
left join public.profiles p on p.id=u.id
left join public.events e on e.id=p.assigned_event_id
where lower(u.email) in (
 'codewave@nmamit.in','leviathan@nmamit.in','coralcanvas@nmamit.in','aquabyte@nmamit.in',
 'aquaverse@nmamit.in','megpitch@nmamit.in','tidetailor@nmamit.in','submarine@nmamit.in',
 'oceanenigma@nmamit.in','abyssarena@nmamit.in','tech@nmamit.in','semaphore@nmamit.in'
)
order by u.email;

notify pgrst,'reload schema';
