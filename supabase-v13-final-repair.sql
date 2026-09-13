-- ============================================================
-- AQUADESK V13 FINAL REPAIR
-- Safe repair for databases that were upgraded from V9/V10/V11/V12
-- without dropping existing operational data.
--
-- Includes:
--   * event_winners schema + exact ON CONFLICT key
--   * winner compatibility columns
--   * safe duplicate cleanup before unique index
--   * attendance upsert key
--   * public_site_content.key compatibility
--   * event access helper functions
--   * PostgREST schema reload
-- ============================================================

-- ------------------------------------------------------------
-- 1. ACCESS HELPERS
-- ------------------------------------------------------------

create or replace function public.current_role()
returns text
language sql
stable
security definer
set search_path=public
as $$
  select role from public.profiles where id=auth.uid();
$$;

grant execute on function public.current_role() to authenticated;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path=public
as $$
  select exists(
    select 1 from public.profiles
    where id=auth.uid()
      and role in ('admin','super_admin','superadmin')
  );
$$;

grant execute on function public.is_admin() to authenticated;

create or replace function public.current_assigned_event_id()
returns uuid
language sql
stable
security definer
set search_path=public
as $$
  select assigned_event_id
  from public.profiles
  where id=auth.uid();
$$;

grant execute on function public.current_assigned_event_id() to authenticated;

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
      and role in ('authorised','event_authorised','admin','super_admin','superadmin')
  );
$$;

grant execute on function public.is_authorised() to authenticated;

create or replace function public.can_view_event(p_event_id uuid)
returns boolean
language sql
stable
security definer
set search_path=public
as $$
  select public.is_admin()
      or exists(
        select 1 from public.profiles
        where id=auth.uid()
          and role in ('authorised','authorized','technical','tech')
      )
      or exists(
        select 1 from public.profiles
        where id=auth.uid()
          and role in ('event_authorised','event_authorized','event_admin')
          and assigned_event_id=p_event_id
      );
$$;

grant execute on function public.can_view_event(uuid) to authenticated;

create or replace function public.can_manage_event(p_event_id uuid)
returns boolean
language sql
stable
security definer
set search_path=public
as $$
  select public.can_view_event(p_event_id);
$$;

grant execute on function public.can_manage_event(uuid) to authenticated;

-- ------------------------------------------------------------
-- 2. EVENT WINNERS - EXACT FRONTEND SCHEMA
-- ------------------------------------------------------------

create table if not exists public.event_winners (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  participant_id uuid,
  college_id uuid,
  team_name text,
  placement integer not null default 1 check (placement > 0),
  note text,
  marked_by uuid references auth.users(id) on delete set null,
  marked_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.event_winners add column if not exists participant_id uuid;
alter table public.event_winners add column if not exists college_id uuid;
alter table public.event_winners add column if not exists team_name text;
alter table public.event_winners add column if not exists placement integer;
alter table public.event_winners add column if not exists note text;
alter table public.event_winners add column if not exists marked_by uuid;
alter table public.event_winners add column if not exists marked_at timestamptz;
alter table public.event_winners add column if not exists created_at timestamptz;
alter table public.event_winners add column if not exists updated_at timestamptz;

-- Compatibility with older column names used by previous repairs.
-- Only copy values; do not remove anything.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='event_winners' and column_name='winner_position'
  ) then
    update public.event_winners
    set placement=winner_position
    where placement is null;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='event_winners' and column_name='notes'
  ) then
    update public.event_winners
    set note=notes
    where note is null and notes is not null;
  end if;
end $$;

update public.event_winners
set placement=1
where placement is null;

update public.event_winners
set marked_at=coalesce(marked_at,created_at,now())
where marked_at is null;

update public.event_winners
set created_at=coalesce(created_at,marked_at,now())
where created_at is null;

update public.event_winners
set updated_at=coalesce(updated_at,marked_at,created_at,now())
where updated_at is null;

-- If an old database accumulated duplicate placements before the unique
-- index existed, keep the most recently marked record for each event/placement.
do $$
begin
  delete from public.event_winners w
  using (
    select ctid,
           row_number() over (
             partition by event_id, placement
             order by marked_at desc nulls last, updated_at desc nulls last, created_at desc nulls last, ctid desc
           ) as rn
    from public.event_winners
  ) d
  where w.ctid=d.ctid and d.rn>1;
end $$;

create unique index if not exists event_winners_event_placement_unique
on public.event_winners(event_id, placement);

-- This is the exact conflict target used by the React winner upsert:
-- .upsert(payload, { onConflict: "event_id,placement" })

alter table public.event_winners enable row level security;

drop policy if exists "event winners read" on public.event_winners;
drop policy if exists "event winners insert" on public.event_winners;
drop policy if exists "event winners update" on public.event_winners;
drop policy if exists "event winners delete" on public.event_winners;

drop policy if exists "authorised winners read" on public.event_winners;
drop policy if exists "authorised winners insert" on public.event_winners;
drop policy if exists "authorised winners update" on public.event_winners;
drop policy if exists "authorised winners delete" on public.event_winners;

create policy "event winners read"
on public.event_winners for select to authenticated
using (public.can_view_event(event_id));

create policy "event winners insert"
on public.event_winners for insert to authenticated
with check (public.can_manage_event(event_id));

create policy "event winners update"
on public.event_winners for update to authenticated
using (public.can_manage_event(event_id))
with check (public.can_manage_event(event_id));

create policy "event winners delete"
on public.event_winners for delete to authenticated
using (public.can_manage_event(event_id));

grant select,insert,update,delete on public.event_winners to authenticated;

-- ------------------------------------------------------------
-- 3. ATTENDANCE - EXACT FRONTEND UPSERT KEY
-- ------------------------------------------------------------

create unique index if not exists attendance_schedule_participant_unique
on public.attendance(schedule_id, participant_id);

-- ------------------------------------------------------------
-- 4. PUBLIC SITE CONTENT - OLD V11 -> CURRENT FRONTEND
-- ------------------------------------------------------------

create table if not exists public.public_site_content (
  key text primary key,
  content text not null default '',
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

alter table public.public_site_content add column if not exists key text;
alter table public.public_site_content add column if not exists content text default '';
alter table public.public_site_content add column if not exists updated_at timestamptz default now();
alter table public.public_site_content add column if not exists updated_by uuid references auth.users(id) on delete set null;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='public_site_content' and column_name='section_key'
  ) then
    update public.public_site_content
    set key=section_key
    where key is null;
  end if;
end $$;

create unique index if not exists public_site_content_key_unique
on public.public_site_content(key);

alter table public.public_site_content enable row level security;

drop policy if exists "public site content read" on public.public_site_content;
drop policy if exists "admin public site content write" on public.public_site_content;

create policy "public site content read"
on public.public_site_content for select to anon,authenticated
using (true);

create policy "admin public site content write"
on public.public_site_content for all to authenticated
using (public.is_admin())
with check (public.is_admin());

grant select on public.public_site_content to anon,authenticated;
grant insert,update,delete on public.public_site_content to authenticated;

-- ------------------------------------------------------------
-- 5. TIMESTAMP TRIGGER
-- ------------------------------------------------------------

create or replace function public.set_event_winners_updated_at()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
begin
  new.updated_at=now();
  return new;
end;
$$;

drop trigger if exists event_winners_updated_at on public.event_winners;
create trigger event_winners_updated_at
before update on public.event_winners
for each row execute function public.set_event_winners_updated_at();

-- ------------------------------------------------------------
-- 5A. AUTHORISED ACCOUNT ASSIGNMENT RPC
-- ------------------------------------------------------------
drop function if exists public.assign_authorized_event(text,uuid);

create function public.assign_authorized_event(p_email text,p_event_id uuid)
returns boolean
language plpgsql
security definer
set search_path=public
as $$
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

  select id into target_user
  from auth.users
  where lower(email)=lower(p_email)
  limit 1;

  select name into target_event_name
  from public.events
  where id=p_event_id
  limit 1;

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
  set assigned_event_id=p_event_id, updated_at=now()
  where lower(email)=lower(p_email);

  if not found then
    raise exception 'Authorised account is not registered';
  end if;

  if target_user is not null then
    if lower(p_email)=lower('TECH@NMAMIT.IN') then
      insert into public.profiles(id,full_name,role,assigned_event_id)
      values(target_user,'Technical Authorised User','authorised',null)
      on conflict(id) do update set
        full_name=excluded.full_name, role='authorised',
        assigned_event_id=null, updated_at=now();
    else
      insert into public.profiles(id,full_name,role,assigned_event_id)
      values(target_user,coalesce(account_event_name,target_event_name),'event_authorised',p_event_id)
      on conflict(id) do update set
        full_name=excluded.full_name, role='event_authorised',
        assigned_event_id=p_event_id, updated_at=now();
    end if;
  end if;

  return true;
end;
$$;

grant execute on function public.assign_authorized_event(text,uuid) to authenticated;

-- ------------------------------------------------------------
-- 5B. SAFE CHAT DIRECTORY VIEW
-- ------------------------------------------------------------
create or replace view public.profile_directory as
select id, full_name, role
from public.profiles;

grant select on public.profile_directory to authenticated;

-- ------------------------------------------------------------
-- 5C. ACTIVITY UPSERT COMPATIBILITY
-- ------------------------------------------------------------
create unique index if not exists user_activity_sessions_user_id_unique
on public.user_activity_sessions(user_id);

-- ------------------------------------------------------------
-- 6. POSTGREST CACHE RELOAD
-- ------------------------------------------------------------

notify pgrst, 'reload schema';

-- ------------------------------------------------------------
-- 7. FINAL VERIFICATION
-- ------------------------------------------------------------

select to_regclass('public.event_winners') as event_winners_table;

select indexname
from pg_indexes
where schemaname='public'
  and tablename='event_winners'
  and indexname='event_winners_event_placement_unique';

select column_name,data_type
from information_schema.columns
where table_schema='public'
  and table_name='event_winners'
order by ordinal_position;
