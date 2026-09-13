-- AQUADESK V5 REPAIR / MIGRATION
-- Safe to run after the earlier partial AquaDesk migrations.
-- Run once in Supabase SQL Editor.
create extension if not exists pgcrypto;

create table if not exists public.profiles(
 id uuid primary key references auth.users(id) on delete cascade,
 full_name text, role text not null default 'authorised', created_at timestamptz default now(), updated_at timestamptz default now()
);
alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists role text default 'authorised';
alter table public.profiles add column if not exists created_at timestamptz default now();
alter table public.profiles add column if not exists updated_at timestamptz default now();
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check(role in ('authorised','admin'));

create table if not exists public.colleges(id uuid primary key default gen_random_uuid(),name text not null,logo_url text,location text,created_at timestamptz default now(),updated_at timestamptz default now());
create table if not exists public.college_contacts(college_id uuid primary key references public.colleges(id) on delete cascade,hod_name text,hod_phone text,hod_email text,coordinator_name text,coordinator_phone text,coordinator_email text,private_notes text,updated_at timestamptz default now());
create table if not exists public.college_status(college_id uuid primary key references public.colleges(id) on delete cascade,status text not null default 'pending' check(status in ('pending','confirmed','denied')),note text,confirmed_at timestamptz,updated_at timestamptz default now());
create table if not exists public.participants_public(id uuid primary key default gen_random_uuid(),college_id uuid not null references public.colleges(id) on delete cascade,name text not null,team_name text,created_at timestamptz default now(),updated_at timestamptz default now());
create table if not exists public.participant_contacts(participant_id uuid primary key references public.participants_public(id) on delete cascade,phone text,email text,updated_at timestamptz default now());
create table if not exists public.events(id uuid primary key default gen_random_uuid(),name text not null,logo_url text,description text,event_date date,start_time time,end_time time,venue text,current_heads text,rules text,created_at timestamptz default now(),updated_at timestamptz default now());
create table if not exists public.event_head_contacts(event_id uuid primary key references public.events(id) on delete cascade,contacts text,updated_at timestamptz default now());

-- Repair the schedule table from the earlier temporary schema.
create table if not exists public.event_schedule(id uuid primary key default gen_random_uuid(),event_id uuid references public.events(id) on delete cascade,event_name text,event_date date,start_time time,end_time time,venue text,created_at timestamptz default now(),updated_at timestamptz default now());
alter table public.event_schedule add column if not exists event_id uuid;
alter table public.event_schedule add column if not exists event_name text;
alter table public.event_schedule add column if not exists event_date date;
alter table public.event_schedule add column if not exists start_time time;
alter table public.event_schedule add column if not exists end_time time;
alter table public.event_schedule add column if not exists venue text;
alter table public.event_schedule add column if not exists created_at timestamptz default now();
alter table public.event_schedule add column if not exists updated_at timestamptz default now();
-- If the old temporary column exists, it must not block inserts from AquaDesk.
do $$ begin
 if exists(select 1 from information_schema.columns where table_schema='public' and table_name='event_schedule' and column_name='schedule_date') then
   alter table public.event_schedule alter column schedule_date drop not null;
   update public.event_schedule set event_date=schedule_date where event_date is null and schedule_date is not null;
 end if;
end $$;

create table if not exists public.event_college_participation(event_id uuid not null references public.events(id) on delete cascade,college_id uuid not null references public.colleges(id) on delete cascade,participating boolean not null default false,updated_at timestamptz default now(),primary key(event_id,college_id));
create table if not exists public.participant_event_participation(participant_id uuid not null references public.participants_public(id) on delete cascade,event_id uuid not null references public.events(id) on delete cascade,participating boolean not null default true,updated_at timestamptz default now(),primary key(participant_id,event_id));
create table if not exists public.attendance(id uuid primary key default gen_random_uuid(),schedule_id uuid not null references public.event_schedule(id) on delete cascade,participant_id uuid not null references public.participants_public(id) on delete cascade,status text not null default 'absent' check(status in('present','absent')),marked_by uuid references auth.users(id) on delete set null,marked_at timestamptz default now(),created_at timestamptz default now(),updated_at timestamptz default now(),unique(schedule_id,participant_id));
create table if not exists public.audit_logs(id bigint generated always as identity primary key,actor_id uuid references auth.users(id) on delete set null,action text not null,entity_type text not null,entity_id uuid,details jsonb,created_at timestamptz default now());

create or replace function public.is_admin() returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from public.profiles where id=auth.uid() and role='admin'); $$;
create or replace function public.is_authorised() returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from public.profiles where id=auth.uid() and role in('authorised','admin')); $$;
create or replace function public.write_audit(p_action text,p_entity_type text,p_entity_id uuid,p_details jsonb default '{}'::jsonb) returns void language plpgsql security definer set search_path=public as $$ begin if auth.uid() is not null then insert into public.audit_logs(actor_id,action,entity_type,entity_id,details) values(auth.uid(),p_action,p_entity_type,p_entity_id,p_details); end if; end; $$;

alter table public.profiles enable row level security;
alter table public.colleges enable row level security;
alter table public.college_contacts enable row level security;
alter table public.college_status enable row level security;
alter table public.participants_public enable row level security;
alter table public.participant_contacts enable row level security;
alter table public.events enable row level security;
alter table public.event_schedule enable row level security;
alter table public.event_head_contacts enable row level security;
alter table public.event_college_participation enable row level security;
alter table public.participant_event_participation enable row level security;
alter table public.attendance enable row level security;
alter table public.audit_logs enable row level security;

do $$ declare r record; begin for r in select schemaname,tablename,policyname from pg_policies where schemaname='public' and tablename in('profiles','colleges','college_contacts','college_status','participants_public','participant_contacts','events','event_schedule','event_head_contacts','event_college_participation','participant_event_participation','attendance','audit_logs') loop execute format('drop policy if exists %I on %I.%I',r.policyname,r.schemaname,r.tablename); end loop; end $$;

create policy "public colleges read" on public.colleges for select to anon,authenticated using(true);
create policy "public participants read" on public.participants_public for select to anon,authenticated using(true);
create policy "public events read" on public.events for select to anon,authenticated using(true);
create policy "public schedule read" on public.event_schedule for select to anon,authenticated using(true);
create policy "own profile read" on public.profiles for select to authenticated using(auth.uid()=id);
create policy "admin profiles all" on public.profiles for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy "authorised contacts read" on public.college_contacts for select to authenticated using(public.is_authorised());
create policy "authorised status read" on public.college_status for select to authenticated using(public.is_authorised());
create policy "authorised participant contacts read" on public.participant_contacts for select to authenticated using(public.is_authorised());
create policy "authorised event heads read" on public.event_head_contacts for select to authenticated using(public.is_authorised());
create policy "authorised college participation read" on public.event_college_participation for select to authenticated using(public.is_authorised());
create policy "authorised participant event read" on public.participant_event_participation for select to authenticated using(public.is_authorised());
create policy "authorised attendance read" on public.attendance for select to authenticated using(public.is_authorised());
create policy "authorised attendance insert" on public.attendance for insert to authenticated with check(public.is_authorised());
create policy "authorised attendance update" on public.attendance for update to authenticated using(public.is_authorised()) with check(public.is_authorised());
create policy "admin colleges all" on public.colleges for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy "admin contacts all" on public.college_contacts for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy "admin status all" on public.college_status for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy "admin participants all" on public.participants_public for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy "admin participant contacts all" on public.participant_contacts for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy "admin events all" on public.events for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy "admin event heads all" on public.event_head_contacts for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy "admin schedule all" on public.event_schedule for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy "admin college participation all" on public.event_college_participation for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy "admin participant event all" on public.participant_event_participation for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy "admin attendance all" on public.attendance for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy "admin audit read" on public.audit_logs for select to authenticated using(public.is_admin());
create policy "admin audit insert" on public.audit_logs for insert to authenticated with check(public.is_admin());

grant select on public.event_schedule to anon,authenticated;
grant select,insert,update,delete on public.event_college_participation to authenticated;
grant select,insert,update,delete on public.participant_event_participation to authenticated;
grant select,insert,update,delete on public.attendance to authenticated;

notify pgrst,'reload schema';

-- ============================================================
-- AquaDesk V6: realtime collaboration + detailed activity
-- ============================================================
create table if not exists public.user_activity_sessions(
  user_id uuid primary key references auth.users(id) on delete cascade,
  last_seen timestamptz not null default now(),
  current_page text,
  user_agent text,
  updated_at timestamptz not null default now()
);

create table if not exists public.chat_messages(
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users(id) on delete cascade,
  message text not null check (char_length(trim(message)) between 1 and 1000),
  created_at timestamptz not null default now(),
  edited_at timestamptz,
  deleted_at timestamptz
);

alter table public.user_activity_sessions enable row level security;
alter table public.chat_messages enable row level security;

drop policy if exists "own activity upsert" on public.user_activity_sessions;
create policy "own activity upsert" on public.user_activity_sessions
for insert to authenticated with check (auth.uid()=user_id);

drop policy if exists "own activity update" on public.user_activity_sessions;
create policy "own activity update" on public.user_activity_sessions
for update to authenticated using(auth.uid()=user_id) with check(auth.uid()=user_id);

drop policy if exists "admin activity read" on public.user_activity_sessions;
create policy "admin activity read" on public.user_activity_sessions
for select to authenticated using(public.is_admin());

drop policy if exists "chat authenticated read" on public.chat_messages;
create policy "chat authenticated read" on public.chat_messages
for select to authenticated using(true);

drop policy if exists "chat authenticated insert" on public.chat_messages;
create policy "chat authenticated insert" on public.chat_messages
for insert to authenticated with check(auth.uid()=sender_id);

drop policy if exists "chat own update" on public.chat_messages;
create policy "chat own update" on public.chat_messages
for update to authenticated using(auth.uid()=sender_id or public.is_admin()) with check(auth.uid()=sender_id or public.is_admin());

drop policy if exists "chat own delete" on public.chat_messages;
create policy "chat own delete" on public.chat_messages
for delete to authenticated using(auth.uid()=sender_id or public.is_admin());

-- Names/roles only are safe for signed-in collaboration; email/phone are not exposed here.
drop policy if exists "authenticated profile directory" on public.profiles;
create policy "authenticated profile directory" on public.profiles
for select to authenticated using(true);

-- A single server-side trigger captures every INSERT/UPDATE/DELETE on operational tables.
create or replace function public.audit_row_change() returns trigger
language plpgsql security definer set search_path=public as $$
declare
  rid uuid;
  payload jsonb;
begin
  if TG_OP='DELETE' then payload:=to_jsonb(OLD); else payload:=to_jsonb(NEW); end if;
  rid := nullif(payload->>'id','')::uuid;
  if rid is null then rid := nullif(payload->>'college_id','')::uuid; end if;
  if rid is null then rid := nullif(payload->>'participant_id','')::uuid; end if;
  if rid is null then rid := nullif(payload->>'event_id','')::uuid; end if;
  insert into public.audit_logs(actor_id,action,entity_type,entity_id,details)
  values(auth.uid(),lower(TG_OP)||'_'||TG_TABLE_NAME,TG_TABLE_NAME,rid,jsonb_build_object('operation',TG_OP,'row',payload,'recorded_at',now()));
  return coalesce(NEW,OLD);
end; $$;

do $$ declare t text; begin
 foreach t in array array['colleges','college_contacts','college_status','participants_public','participant_contacts','events','event_schedule','event_head_contacts','event_college_participation','participant_event_participation','attendance','user_activity_sessions','chat_messages'] loop
   execute format('drop trigger if exists trg_audit_%I on public.%I',t,t);
   execute format('create trigger trg_audit_%I after insert or update or delete on public.%I for each row execute function public.audit_row_change()',t,t);
 end loop;
end $$;

-- Allow the security-definer audit RPC to be called by signed-in users.
grant execute on function public.write_audit(text,text,uuid,jsonb) to authenticated;

-- Realtime for live chat and live admin activity.
do $$ begin
  alter publication supabase_realtime add table public.chat_messages;
exception when duplicate_object then null; end $$;

do $$ begin
  alter publication supabase_realtime add table public.audit_logs;
exception when duplicate_object then null; end $$;

notify pgrst,'reload schema';
