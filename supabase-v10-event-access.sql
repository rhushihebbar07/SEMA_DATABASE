-- ============================================================
-- AQUADESK V10 - SYSTEMATIC EVENT WORKSPACES + DATA ISOLATION
-- Based on the supplied Semaphore 2K26 brochure.
--
-- Brand/account -> actual event:
-- CODEWAVE       -> Coding
-- LEVIATHAN      -> IT Manager
-- CORALCANVAS    -> Web Design
-- AQUABYTE       -> IT Quiz
-- AQUAVERSE      -> Tech Talk
-- MEGPITCH       -> Startup Event
-- TIDETAILOR     -> Fashion Show
-- SUBMARINE      -> Photography & Videography
-- OCEANENIGMA    -> Surprise Event
-- ABYSSARENA     -> Gaming / BGMI
--
-- This migration DOES NOT delete/reset colleges, statuses,
-- participants, registrations, schedules, or attendance.
-- ============================================================

-- ---------- 1. PROFILE ROLE + ASSIGNMENT ----------
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
check(role in('authorised','event_authorised','admin'));
alter table public.profiles
add column if not exists assigned_event_id uuid references public.events(id) on delete set null;

-- ---------- 2. AUTHORISED ACCOUNT REGISTRY ----------
create table if not exists public.authorized_event_accounts(
  email text primary key,
  display_name text not null,
  event_name text not null default '',
  actual_event_name text not null default '',
  assigned_event_id uuid references public.events(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.authorized_event_accounts
add column if not exists actual_event_name text not null default '';
alter table public.authorized_event_accounts
add column if not exists assigned_event_id uuid references public.events(id) on delete set null;
alter table public.authorized_event_accounts
add column if not exists updated_at timestamptz not null default now();

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
 display_name=excluded.display_name,
 event_name=excluded.event_name,
 actual_event_name=excluded.actual_event_name,
 updated_at=now();

-- ---------- 3. RESOLVE INITIAL ASSIGNMENT ----------
update public.authorized_event_accounts a
set assigned_event_id=e.id, updated_at=now()
from public.events e
where lower(a.event_name)=lower(e.name)
  and a.email <> 'TECH@NMAMIT.IN';

-- ---------- 4. ACCESS HELPERS ----------
create or replace function public.current_role()
returns text language sql stable security definer set search_path=public as $$
  select role from public.profiles where id=auth.uid() limit 1;
$$;

grant execute on function public.current_role() to authenticated;

create or replace function public.current_assigned_event_id()
returns uuid language sql stable security definer set search_path=public as $$
  select assigned_event_id from public.profiles
  where id=auth.uid() and role='event_authorised'
  limit 1;
$$;

grant execute on function public.current_assigned_event_id() to authenticated;

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

-- ---------- 5. SAFE PROFILE VISIBILITY ----------
alter table public.profiles enable row level security;
drop policy if exists "profile directory read" on public.profiles;
drop policy if exists "own profile read" on public.profiles;
drop policy if exists "admin profiles all" on public.profiles;

create policy "own profile read" on public.profiles
for select to authenticated using(auth.uid()=id);
create policy "admin profiles all" on public.profiles
for all to authenticated using(public.is_admin()) with check(public.is_admin());

-- ---------- 6. PRIVATE PARTICIPANT DATA ----------
alter table public.participants_public enable row level security;
alter table public.participant_event_participation enable row level security;
alter table public.participant_contacts enable row level security;
alter table public.event_college_participation enable row level security;
alter table public.college_contacts enable row level security;
alter table public.college_status enable row level security;

-- Remove broad read policies that exposed every participant to every authorised account.
drop policy if exists "public participants read" on public.participants_public;
drop policy if exists "authorised participants read" on public.participants_public;
drop policy if exists "authorised participation read" on public.event_college_participation;
drop policy if exists "authorised participant event read" on public.participant_event_participation;
drop policy if exists "authorised participant contacts read" on public.participant_contacts;
drop policy if exists "authorised contacts read" on public.college_contacts;
drop policy if exists "authorised status read" on public.college_status;

-- Admin + TECH can see all participant data.
create policy "staff all participants read" on public.participants_public
for select to authenticated using(public.is_admin() or public.current_role()='authorised');

-- Event account sees ONLY participants registered for its assigned event.
create policy "assigned event participants read" on public.participants_public
for select to authenticated using(
  public.is_event_authorised()
  and exists(
    select 1 from public.participant_event_participation pep
    where pep.participant_id=participants_public.id
      and pep.participating=true
      and pep.event_id=public.current_assigned_event_id()
  )
);

create policy "staff participant event read" on public.participant_event_participation
for select to authenticated using(public.is_admin() or public.current_role()='authorised');

create policy "assigned event participant event read" on public.participant_event_participation
for select to authenticated using(
  public.is_event_authorised()
  and event_id=public.current_assigned_event_id()
);

create policy "staff event college read" on public.event_college_participation
for select to authenticated using(public.is_admin() or public.current_role()='authorised');

create policy "assigned event college read" on public.event_college_participation
for select to authenticated using(
  public.is_event_authorised() and event_id=public.current_assigned_event_id()
);

create policy "staff participant contacts read" on public.participant_contacts
for select to authenticated using(public.is_admin() or public.current_role()='authorised');

create policy "assigned participant contacts read" on public.participant_contacts
for select to authenticated using(
  public.is_event_authorised()
  and exists(
    select 1 from public.participant_event_participation pep
    where pep.participant_id=participant_contacts.participant_id
      and pep.participating=true
      and pep.event_id=public.current_assigned_event_id()
  )
);

create policy "staff college contacts read" on public.college_contacts
for select to authenticated using(public.is_admin() or public.current_role()='authorised');

create policy "assigned college contacts read" on public.college_contacts
for select to authenticated using(
  public.is_event_authorised()
  and exists(
    select 1 from public.event_college_participation ecp
    where ecp.college_id=college_contacts.college_id
      and ecp.event_id=public.current_assigned_event_id()
      and ecp.participating=true
  )
);

create policy "staff college status read" on public.college_status
for select to authenticated using(public.is_admin() or public.current_role()='authorised');

create policy "assigned college status read" on public.college_status
for select to authenticated using(
  public.is_event_authorised()
  and exists(
    select 1 from public.event_college_participation ecp
    where ecp.college_id=college_status.college_id
      and ecp.event_id=public.current_assigned_event_id()
      and ecp.participating=true
  )
);

-- Keep admin CRUD policies from the base schema.
drop policy if exists "admin participants all" on public.participants_public;
create policy "admin participants all" on public.participants_public for all to authenticated using(public.is_admin()) with check(public.is_admin());
drop policy if exists "admin participant event all" on public.participant_event_participation;
create policy "admin participant event all" on public.participant_event_participation for all to authenticated using(public.is_admin()) with check(public.is_admin());
drop policy if exists "admin participant contacts all" on public.participant_contacts;
create policy "admin participant contacts all" on public.participant_contacts for all to authenticated using(public.is_admin()) with check(public.is_admin());
drop policy if exists "admin participation all" on public.event_college_participation;
create policy "admin participation all" on public.event_college_participation for all to authenticated using(public.is_admin()) with check(public.is_admin());
drop policy if exists "admin contacts all" on public.college_contacts;
create policy "admin contacts all" on public.college_contacts for all to authenticated using(public.is_admin()) with check(public.is_admin());
drop policy if exists "admin status all" on public.college_status;
create policy "admin status all" on public.college_status for all to authenticated using(public.is_admin()) with check(public.is_admin());

-- ---------- 7. ATTENDANCE: READ/WRITE ONLY FOR ASSIGNED EVENT ----------
alter table public.attendance enable row level security;
drop policy if exists "authorised attendance read" on public.attendance;
drop policy if exists "authorised attendance insert" on public.attendance;
drop policy if exists "authorised attendance update" on public.attendance;

create policy "event attendance read" on public.attendance
for select to authenticated using(
  public.can_view_event((select es.event_id from public.event_schedule es where es.id=attendance.schedule_id))
);

create policy "event attendance insert" on public.attendance
for insert to authenticated with check(
  public.can_manage_event((select es.event_id from public.event_schedule es where es.id=attendance.schedule_id))
  and exists(
    select 1 from public.participant_event_participation pep
    where pep.participant_id=attendance.participant_id
      and pep.participating=true
      and pep.event_id=(select es.event_id from public.event_schedule es where es.id=attendance.schedule_id)
  )
);

create policy "event attendance update" on public.attendance
for update to authenticated
using(public.can_manage_event((select es.event_id from public.event_schedule es where es.id=attendance.schedule_id)))
with check(
  public.can_manage_event((select es.event_id from public.event_schedule es where es.id=attendance.schedule_id))
  and exists(
    select 1 from public.participant_event_participation pep
    where pep.participant_id=attendance.participant_id
      and pep.participating=true
      and pep.event_id=(select es.event_id from public.event_schedule es where es.id=attendance.schedule_id)
  )
);

drop policy if exists "admin attendance all" on public.attendance;
create policy "admin attendance all" on public.attendance for all to authenticated using(public.is_admin()) with check(public.is_admin());

-- ---------- 8. WINNERS ----------
create table if not exists public.event_winners(
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  participant_id uuid references public.participants_public(id) on delete set null,
  team_name text,
  placement integer not null default 1 check(placement>0),
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
create policy "event winners read" on public.event_winners for select to authenticated using(public.can_view_event(event_id));
create policy "event winners insert" on public.event_winners for insert to authenticated with check(public.can_manage_event(event_id));
create policy "event winners update" on public.event_winners for update to authenticated using(public.can_manage_event(event_id)) with check(public.can_manage_event(event_id));
create policy "event winners delete" on public.event_winners for delete to authenticated using(public.can_manage_event(event_id));
grant select,insert,update,delete on public.event_winners to authenticated;

-- ---------- 9. SYNC AUTH USERS ----------
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

  eid:=a.assigned_event_id;
  if eid is null and a.event_name<>'' then
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

-- Existing Auth users.
insert into public.profiles(id,full_name,role,assigned_event_id)
select u.id,a.display_name,'event_authorised',a.assigned_event_id
from auth.users u join public.authorized_event_accounts a on lower(u.email)=lower(a.email)
where lower(u.email)<>lower('TECH@NMAMIT.IN') and lower(u.email)<>lower('SEMAPHORE@NMAMIT.IN')
on conflict(id) do update set full_name=excluded.full_name,role='event_authorised',assigned_event_id=excluded.assigned_event_id,updated_at=now();

insert into public.profiles(id,full_name,role,assigned_event_id)
select u.id,'Technical Authorised User','authorised',null
from auth.users u where lower(u.email)=lower('TECH@NMAMIT.IN')
on conflict(id) do update set full_name=excluded.full_name,role='authorised',assigned_event_id=null,updated_at=now();

insert into public.profiles(id,full_name,role,assigned_event_id)
select u.id,'Semaphore Super Admin','admin',null
from auth.users u where lower(u.email)=lower('SEMAPHORE@NMAMIT.IN')
on conflict(id) do update set full_name=excluded.full_name,role='admin',assigned_event_id=null,updated_at=now();

-- ---------- 10. INDEXES ----------
create index if not exists idx_profiles_assigned_event on public.profiles(assigned_event_id);
create index if not exists idx_pep_event_participant on public.participant_event_participation(event_id,participant_id,participating);
create index if not exists idx_ecp_event_college on public.event_college_participation(event_id,college_id,participating);
create index if not exists idx_attendance_schedule_participant on public.attendance(schedule_id,participant_id);
create index if not exists idx_authorized_accounts_assigned_event on public.authorized_event_accounts(assigned_event_id);

notify pgrst,'reload schema';

-- ---------- 11. VERIFICATION ----------
select email,display_name,event_name,actual_event_name,assigned_event_id
from public.authorized_event_accounts
order by email;

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

-- ---------- 12. ADMIN-ONLY EVENT ASSIGNMENT RPC ----------
create or replace function public.assign_authorized_event(p_email text,p_event_id uuid)
returns boolean
language plpgsql security definer set search_path=public as $$
declare
  target_user uuid;
  target_name text;
  target_event_name text;
begin
  if not public.is_admin() then
    raise exception 'Only Super Admin can assign authorised event accounts';
  end if;

  select id into target_user from auth.users where lower(email)=lower(p_email) limit 1;
  select name into target_event_name from public.events where id=p_event_id limit 1;

  if p_event_id is not null and target_event_name is null then
    raise exception 'Selected event does not exist';
  end if;

  if lower(p_email)=lower('TECH@NMAMIT.IN') then
    raise exception 'TECH is a global account and cannot be assigned to one event';
  end if;

  update public.authorized_event_accounts
  set assigned_event_id=p_event_id,
      event_name=coalesce(target_event_name,''),
      updated_at=now()
  where lower(email)=lower(p_email);

  if not found then
    raise exception 'Authorised account is not registered';
  end if;

  if target_user is not null then
    select display_name into target_name
    from public.authorized_event_accounts
    where lower(email)=lower(p_email);

    update public.profiles
    set role='event_authorised',
        assigned_event_id=p_event_id,
        full_name=coalesce(target_name,full_name),
        updated_at=now()
    where id=target_user;
  end if;

  perform public.write_audit(
    'assign_authorized_event',
    'authorized_event_account',
    null,
    jsonb_build_object('email',upper(p_email),'event_id',p_event_id,'event_name',target_event_name)
  );

  return true;
end;
$$;

grant execute on function public.assign_authorized_event(text,uuid) to authenticated;

notify pgrst,'reload schema';

-- ---------- 13. SAFE CHAT DIRECTORY ----------
-- Chat needs display names for everyone, but must not expose
-- private profile fields such as assigned_event_id.
create or replace view public.profile_directory as
select id, full_name, role
from public.profiles;

grant select on public.profile_directory to authenticated;

notify pgrst,'reload schema';
