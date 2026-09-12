-- ============================================================
-- AQUADESK / SEMAPHORE 2K26
-- COMPLETE, MIGRATION-SAFE SUPABASE SCHEMA
-- ============================================================

create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- ENUMS
-- ------------------------------------------------------------
do $$ begin
  if not exists (select 1 from pg_type where typname='user_role') then
    create type public.user_role as enum ('authorised','admin');
  end if;
exception when duplicate_object then null; end $$;

do $$ begin
  if not exists (select 1 from pg_type where typname='confirmation_status') then
    create type public.confirmation_status as enum ('pending','confirmed','denied');
  end if;
exception when duplicate_object then null; end $$;

-- ------------------------------------------------------------
-- PROFILES - compatible with existing text role constraints
-- ------------------------------------------------------------
create table if not exists public.profiles(
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'authorised',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists created_at timestamptz default now();
alter table public.profiles add column if not exists updated_at timestamptz default now();
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles alter column role type text using role::text;
update public.profiles set role='authorised' where role is null;
alter table public.profiles add constraint profiles_role_check check(role in('authorised','admin'));

-- ------------------------------------------------------------
-- COLLEGES
-- ------------------------------------------------------------
create table if not exists public.colleges(
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_url text,
  location text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.colleges add column if not exists logo_url text;
alter table public.colleges add column if not exists location text;
alter table public.colleges add column if not exists created_at timestamptz default now();
alter table public.colleges add column if not exists updated_at timestamptz default now();

-- ------------------------------------------------------------
-- PRIVATE COLLEGE CONTACTS
-- ------------------------------------------------------------
create table if not exists public.college_contacts(
  college_id uuid primary key references public.colleges(id) on delete cascade,
  hod_name text, hod_phone text, hod_email text,
  coordinator_name text, coordinator_phone text, coordinator_email text,
  private_notes text,
  updated_at timestamptz default now()
);

-- ------------------------------------------------------------
-- COLLEGE CONFIRMATION
-- ------------------------------------------------------------
create table if not exists public.college_status(
  college_id uuid primary key references public.colleges(id) on delete cascade,
  status text not null default 'pending' check(status in('pending','confirmed','denied')),
  note text,
  confirmed_at timestamptz,
  updated_at timestamptz default now()
);

-- ------------------------------------------------------------
-- PUBLIC PARTICIPANTS - NO PRIVATE CONTACT DATA HERE
-- ------------------------------------------------------------
create table if not exists public.participants_public(
  id uuid primary key default gen_random_uuid(),
  college_id uuid not null references public.colleges(id) on delete cascade,
  name text not null,
  team_name text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ------------------------------------------------------------
-- PRIVATE PARTICIPANT CONTACTS
-- ------------------------------------------------------------
create table if not exists public.participant_contacts(
  participant_id uuid primary key references public.participants_public(id) on delete cascade,
  phone text,
  email text,
  updated_at timestamptz default now()
);

-- ------------------------------------------------------------
-- EVENTS
-- ------------------------------------------------------------
create table if not exists public.events(
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_url text,
  description text,
  event_date date,
  start_time time,
  end_time time,
  venue text,
  current_heads text,
  rules text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ------------------------------------------------------------
-- PRIVATE EVENT HEAD CONTACTS
-- Names can be public; phone numbers remain private.
-- ------------------------------------------------------------
create table if not exists public.event_head_contacts(
  event_id uuid primary key references public.events(id) on delete cascade,
  contacts text,
  updated_at timestamptz default now()
);

-- ------------------------------------------------------------
-- EVENT SCHEDULE - editable official timetable
-- ------------------------------------------------------------
create table if not exists public.event_schedule(
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events(id) on delete cascade,
  event_name text,
  event_date date not null,
  start_time time,
  end_time time,
  venue text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.event_schedule add column if not exists event_name text;
alter table public.event_schedule add column if not exists event_id uuid;
alter table public.event_schedule add column if not exists event_date date;
alter table public.event_schedule add column if not exists start_time time;
alter table public.event_schedule add column if not exists end_time time;
alter table public.event_schedule add column if not exists venue text;
alter table public.event_schedule add column if not exists created_at timestamptz default now();
alter table public.event_schedule add column if not exists updated_at timestamptz default now();

-- ------------------------------------------------------------
-- COLLEGE <-> EVENT PARTICIPATION MATRIX
-- ------------------------------------------------------------
create table if not exists public.event_college_participation(
  event_id uuid not null references public.events(id) on delete cascade,
  college_id uuid not null references public.colleges(id) on delete cascade,
  participating boolean not null default false,
  updated_at timestamptz default now(),
  primary key(event_id,college_id)
);

-- ------------------------------------------------------------
-- ATTENDANCE PER SCHEDULE SLOT + PARTICIPANT
-- ------------------------------------------------------------
create table if not exists public.attendance(
  id uuid primary key default gen_random_uuid(),
  schedule_id uuid not null references public.event_schedule(id) on delete cascade,
  participant_id uuid not null references public.participants_public(id) on delete cascade,
  status text not null default 'present' check(status in('present','absent')),
  marked_by uuid references auth.users(id) on delete set null,
  marked_at timestamptz default now(),
  unique(schedule_id,participant_id)
);

-- ------------------------------------------------------------
-- AUDIT LOGS
-- ------------------------------------------------------------
create table if not exists public.audit_logs(
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  details jsonb,
  created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- UPDATED AT
-- ------------------------------------------------------------
create or replace function public.set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at=now(); return new; end; $$;

drop trigger if exists colleges_updated_at on public.colleges;
create trigger colleges_updated_at before update on public.colleges for each row execute function public.set_updated_at();
drop trigger if exists college_contacts_updated_at on public.college_contacts;
create trigger college_contacts_updated_at before update on public.college_contacts for each row execute function public.set_updated_at();
drop trigger if exists college_status_updated_at on public.college_status;
create trigger college_status_updated_at before update on public.college_status for each row execute function public.set_updated_at();
drop trigger if exists participants_public_updated_at on public.participants_public;
create trigger participants_public_updated_at before update on public.participants_public for each row execute function public.set_updated_at();
drop trigger if exists participant_contacts_updated_at on public.participant_contacts;
create trigger participant_contacts_updated_at before update on public.participant_contacts for each row execute function public.set_updated_at();
drop trigger if exists events_updated_at on public.events;
create trigger events_updated_at before update on public.events for each row execute function public.set_updated_at();
drop trigger if exists event_schedule_updated_at on public.event_schedule;
create trigger event_schedule_updated_at before update on public.event_schedule for each row execute function public.set_updated_at();
drop trigger if exists event_head_contacts_updated_at on public.event_head_contacts;
create trigger event_head_contacts_updated_at before update on public.event_head_contacts for each row execute function public.set_updated_at();
drop trigger if exists event_participation_updated_at on public.event_college_participation;
create trigger event_participation_updated_at before update on public.event_college_participation for each row execute function public.set_updated_at();
drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- SECURITY FUNCTIONS
-- ------------------------------------------------------------
create or replace function public.is_admin() returns boolean language sql stable security definer set search_path=public as $$
 select exists(select 1 from public.profiles where id=auth.uid() and role='admin');
$$;
create or replace function public.is_authorised() returns boolean language sql stable security definer set search_path=public as $$
 select exists(select 1 from public.profiles where id=auth.uid() and role in('authorised','admin'));
$$;

create or replace function public.write_audit(p_action text,p_entity_type text,p_entity_id uuid,p_details jsonb default '{}'::jsonb)
returns void language plpgsql security definer set search_path=public as $$
begin
 if auth.uid() is not null then
  insert into public.audit_logs(actor_id,action,entity_type,entity_id,details) values(auth.uid(),p_action,p_entity_type,p_entity_id,p_details);
 end if;
end; $$;

-- ------------------------------------------------------------
-- RLS
-- ------------------------------------------------------------
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
alter table public.attendance enable row level security;
alter table public.audit_logs enable row level security;

-- Remove old policies including the insecure public students policy.
do $$ declare r record; begin
 for r in select schemaname,tablename,policyname from pg_policies where schemaname='public' and tablename in('profiles','colleges','college_contacts','college_status','students','participants_public','participant_contacts','events','event_schedule','event_head_contacts','event_college_participation','attendance','audit_logs') loop
  execute format('drop policy if exists %I on %I.%I',r.policyname,r.schemaname,r.tablename);
 end loop;
end $$;

-- PUBLIC
create policy "public colleges read" on public.colleges for select to anon,authenticated using(true);
create policy "public participants read" on public.participants_public for select to anon,authenticated using(true);
create policy "public events read" on public.events for select to anon,authenticated using(true);
create policy "public schedule read" on public.event_schedule for select to anon,authenticated using(true);

-- PROFILES
create policy "own profile read" on public.profiles for select to authenticated using(auth.uid()=id);
create policy "admin profiles all" on public.profiles for all to authenticated using(public.is_admin()) with check(public.is_admin());

-- PRIVATE READ
create policy "authorised contacts read" on public.college_contacts for select to authenticated using(public.is_authorised());
create policy "authorised event head contacts read" on public.event_head_contacts for select to authenticated using(public.is_authorised());
create policy "authorised status read" on public.college_status for select to authenticated using(public.is_authorised());
create policy "authorised participant contacts read" on public.participant_contacts for select to authenticated using(public.is_authorised());
create policy "authorised participation read" on public.event_college_participation for select to authenticated using(public.is_authorised());
create policy "authorised attendance read" on public.attendance for select to authenticated using(public.is_authorised());

-- AUTHORISED ATTENDANCE WRITE
create policy "authorised attendance insert" on public.attendance for insert to authenticated with check(public.is_authorised());
create policy "authorised attendance update" on public.attendance for update to authenticated using(public.is_authorised()) with check(public.is_authorised());

-- ADMIN FULL CRUD
create policy "admin colleges all" on public.colleges for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy "admin contacts all" on public.college_contacts for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy "admin status all" on public.college_status for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy "admin participants all" on public.participants_public for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy "admin participant contacts all" on public.participant_contacts for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy "admin events all" on public.events for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy "admin event head contacts all" on public.event_head_contacts for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy "admin schedule all" on public.event_schedule for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy "admin participation all" on public.event_college_participation for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy "admin attendance all" on public.attendance for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy "admin logs read" on public.audit_logs for select to authenticated using(public.is_admin());
create policy "admin logs insert" on public.audit_logs for insert to authenticated with check(public.is_admin());

-- ------------------------------------------------------------
-- MIGRATE OLD students DATA IF PRESENT
-- ------------------------------------------------------------
do $$ begin
 if to_regclass('public.students') is not null then
  insert into public.participants_public(id,college_id,name,team_name)
  select s.id,s.college_id,s.name,s.team_name from public.students s
  where not exists(select 1 from public.participants_public p where p.id=s.id)
  on conflict do nothing;

  insert into public.participant_contacts(participant_id,phone,email)
  select s.id,s.phone,s.email from public.students s
  where not exists(select 1 from public.participant_contacts pc where pc.participant_id=s.id)
  on conflict do nothing;
 end if;
end $$;

-- Lock old students table from public access. Keep admin access for migration compatibility.
-- Existing public students policies were removed above.

-- ------------------------------------------------------------
-- PROFILE SYNC - NO AUTH CREATION TRIGGER
-- ------------------------------------------------------------
insert into public.profiles(id,full_name,role)
select id,'Semaphore Super Admin','admin' from auth.users where lower(email)=lower('SEMAPHORE@NMAMIT.IN')
on conflict(id) do update set full_name='Semaphore Super Admin',role='admin',updated_at=now();

insert into public.profiles(id,full_name,role)
select id,'Technical Authorised User','authorised' from auth.users where lower(email)=lower('TECH@NMAMIT.IN')
on conflict(id) do update set full_name='Technical Authorised User',role='authorised',updated_at=now();

-- ------------------------------------------------------------
-- STORAGE
-- ------------------------------------------------------------
insert into storage.buckets(id,name,public) values('aquadesk-assets','aquadesk-assets',true)
on conflict(id) do update set public=true;

drop policy if exists "aquadesk public assets read" on storage.objects;
drop policy if exists "aquadesk admin assets insert" on storage.objects;
drop policy if exists "aquadesk admin assets update" on storage.objects;
drop policy if exists "aquadesk admin assets delete" on storage.objects;
create policy "aquadesk public assets read" on storage.objects for select to anon,authenticated using(bucket_id='aquadesk-assets');
create policy "aquadesk admin assets insert" on storage.objects for insert to authenticated with check(bucket_id='aquadesk-assets' and public.is_admin());
create policy "aquadesk admin assets update" on storage.objects for update to authenticated using(bucket_id='aquadesk-assets' and public.is_admin()) with check(bucket_id='aquadesk-assets' and public.is_admin());
create policy "aquadesk admin assets delete" on storage.objects for delete to authenticated using(bucket_id='aquadesk-assets' and public.is_admin());

-- ------------------------------------------------------------
-- INDEXES
-- ------------------------------------------------------------
create index if not exists idx_colleges_name on public.colleges(name);
create index if not exists idx_participants_college on public.participants_public(college_id);
create index if not exists idx_schedule_date on public.event_schedule(event_date,start_time);
create index if not exists idx_schedule_event on public.event_schedule(event_id);
create index if not exists idx_participation_event on public.event_college_participation(event_id);
create index if not exists idx_attendance_schedule on public.attendance(schedule_id);
create index if not exists idx_audit_created on public.audit_logs(created_at desc);

-- ------------------------------------------------------------
-- SEED OFFICIAL EVENTS FROM SUPPLIED SEMAPHORE 2K26 PDF
-- ------------------------------------------------------------
insert into public.events(name,description,current_heads,rules)
select * from (values
 ('CodeWave','Coding','Hayas'||E'\n'||'Shashidhara','Number of participants: 2.'||E'\n'||'Participants may use C, Java, or Python.'||E'\n'||'Basic knowledge of Data Structures & Algorithms is expected.'||E'\n'||'Internet, AI tools, and external assistance are not allowed.'||E'\n'||'Round-specific rules will be announced before each round.'),
 ('Leviathan','IT Manager','Jathin'||E'\n'||'Hasth','This is a solo event, and each participant will compete individually.'||E'\n'||'Participants are expected to maintain professional and respectful conduct throughout the event.'||E'\n'||'Cheating, unfair practice, or misconduct will result in disqualification.'),
 ('Coral Canvas','Web Design','Swasthik'||E'\n'||'Udith','Participants: 2 participants per team.'||E'\n'||'Skills: Knowledge of HTML, CSS & JavaScript is required.'||E'\n'||'Tasks and design rounds will be given on the spot.'||E'\n'||'Electronic gadgets are not allowed.'),
 ('Aqua Byte','IT Quiz','Thushar'||E'\n'||'Prathiksha','Participants: Each team shall consist of 2 participants.'||E'\n'||'Topics include General Knowledge, Technical Knowledge, Programming, IT, Computer Science and other IT-related topics.'||E'\n'||'Mobile phones, smartwatches and electronic gadgets are strictly prohibited.'),
 ('Aquaverse','Tech Talk','Krupa'||E'\n'||'Hruthika','Each participant will compete individually.'||E'\n'||'The topic for each round will be disclosed a few minutes before it begins.'||E'\n'||'Judges decisions are final and binding.'||E'\n'||'Respectful and professional behaviour is required.'),
 ('The Mega Pitch','Startup Event','Sumanth'||E'\n'||'Shahavez','Number of participants: 2.'||E'\n'||'Participants must bring their own laptops.'||E'\n'||'Round details will be disclosed on the spot.'),
 ('Tide & Tailor','Fashion Show','Prapthi'||E'\n'||'Prathiksha','Each team must have 2 members and follow a corporate/professional theme.'||E'\n'||'Formal, business casual, modern office or power-dressing styles.'||E'\n'||'Stage performance: 2+1 minutes.'),
 ('Submarine','Photography & Videography','Goutam'||E'\n'||'Bhargavi','1 participant per entry.'||E'\n'||'DSLR/mirrorless cameras and smartphones are allowed.'||E'\n'||'All content must be captured within the NMAMIT Nitte campus.'||E'\n'||'AI-generated content and stock/pre-shot content are prohibited.'),
 ('Ocean Enigma','Surprise Event','Sameeksha'||E'\n'||'Dheemanth','Each team consists of 2 participants.'||E'\n'||'Event details will be revealed only at the venue.'||E'\n'||'Surprise bonus challenges may appear at any time.'||E'\n'||'Electronic devices are not allowed.'),
 ('Abyss Arena','Gaming — BGMI','Jithesh'||E'\n'||'Keerthan','Each team must consist of 4 players.'||E'\n'||'Emulators, iPads and triggers are not allowed.'||E'\n'||'Players must bring their own mobile devices and accessories.'||E'\n'||'Misconduct or unfair play will lead to disqualification.')
) as v(name,description,current_heads,rules)
where not exists(select 1 from public.events e where lower(e.name)=lower(v.name));

-- ------------------------------------------------------------
-- PRIVATE EVENT HEAD CONTACTS FROM SUPPLIED PDF
-- ------------------------------------------------------------
insert into public.event_head_contacts(event_id,contacts)
select e.id,v.contacts from (values
 ('CodeWave','Hayas'||E'\n'||'Shashidhara'),
 ('Leviathan','Jathin'||E'\n'||'Hasth'),
 ('Coral Canvas','Swasthik'||E'\n'||'Udith'),
 ('Aqua Byte','Thushar'||E'\n'||'Prathiksha'),
 ('Aquaverse','Krupa'||E'\n'||'Hruthika'),
 ('The Mega Pitch','Sumanth'||E'\n'||'Shahavez'),
 ('Tide & Tailor','Prapthi'||E'\n'||'Prathiksha'),
 ('Submarine','Goutam'||E'\n'||'Bhargavi'),
 ('Ocean Enigma','Sameeksha'||E'\n'||'Dheemanth'),
 ('Abyss Arena','Jithesh'||E'\n'||'Keerthan')
) as v(name,contacts)
join public.events e on lower(e.name)=lower(v.name)
on conflict(event_id) do update set contacts=excluded.contacts,updated_at=now();

-- Keep public event rows phone-free.
update public.events set current_heads = case lower(name)
 when 'codewave' then 'Hayas\nShashidhara'
 when 'leviathan' then 'Jathin\nHasth'
 when 'coral canvas' then 'Swasthik\nUdith'
 when 'aqua byte' then 'Thushar\nPrathiksha'
 when 'aquaverse' then 'Krupa\nHruthika'
 when 'the mega pitch' then 'Sumanth\nShahavez'
 when 'tide & tailor' then 'Prapthi\nPrathiksha'
 when 'submarine' then 'Goutam\nBhargavi'
 when 'ocean enigma' then 'Sameeksha\nDheemanth'
 when 'abyss arena' then 'Jithesh\nKeerthan'
 else current_heads end
where lower(name) in ('codewave','leviathan','coral canvas','aqua byte','aquaverse','the mega pitch','tide & tailor','submarine','ocean enigma','abyss arena');

-- ------------------------------------------------------------
-- SEED OFFICIAL SCHEDULE FROM SUPPLIED PDF
-- ------------------------------------------------------------
insert into public.event_schedule(event_id,event_name,event_date,start_time,end_time,venue)
select e.id,v.event_name,v.event_date::date,v.start_time::time,v.end_time::time,v.venue
from (values
 ('Registration & Breakfast','2026-09-17','08:00','09:00','Auditorium Foyer'),
 ('Inaugural Ceremony','2026-09-17','09:00','11:00','Sambhram Auditorium'),
 ('Tide & Tailor','2026-09-17','11:00','12:00','Sambhram Auditorium'),
 ('Coral Canvas','2026-09-17','11:00','12:00','MCA Lab 1'),
 ('CodeWave','2026-09-17','11:00','13:00','MCA Lab 2'),
 ('Leviathan','2026-09-17','11:00','16:00','Netravathi Hall'),
 ('Submarine','2026-09-17','11:00','16:00','Sowparnika'),
 ('Ocean Enigma','2026-09-17','12:15','13:15','LH 402'),
 ('The Mega Pitch','2026-09-17','13:00','15:00','Shambavi Hall'),
 ('Aquaverse','2026-09-17','13:00','14:30','Palguni Hall'),
 ('Abyss Arena','2026-09-17','13:00','16:00','MCA Lab 3 & MCA Lab 4'),
 ('Ocean Enigma','2026-09-17','14:00','16:00','Sambhram Auditorium'),
 ('Coral Canvas','2026-09-17','14:45','16:15','MCA Lab 1'),
 ('CodeWave','2026-09-17','14:45','16:15','MCA Lab 2'),
 ('Aqua Byte','2026-09-17','15:15','16:15','Robotics Lab'),
 ('Aqua Byte','2026-09-18','09:00','10:00','NC 36'),
 ('Aquaverse','2026-09-18','09:00','10:30','Sambhram Auditorium'),
 ('CodeWave','2026-09-18','09:00','13:00','MCA Lab 2'),
 ('Submarine','2026-09-18','09:00','13:00','Sowparnika'),
 ('Leviathan','2026-09-18','09:00','11:45','Netravathi Hall'),
 ('The Mega Pitch','2026-09-18','10:15','11:45','Shambavi Hall'),
 ('Coral Canvas','2026-09-18','10:15','13:30','MCA Lab 1'),
 ('Abyss Arena','2026-09-18','10:15','13:30','MCA Lab 4'),
 ('Ocean Enigma','2026-09-18','10:15','13:30','LH 402'),
 ('Aqua Byte','2026-09-18','12:00','13:30','Sambhram Auditorium'),
 ('Leviathan','2026-09-18','13:30','15:00','Sambhram / Sowparnika'),
 ('Valedictory Ceremony','2026-09-18','15:00',null,'Sambhram Auditorium')
) as v(event_name,event_date,start_time,end_time,venue)
left join public.events e on lower(e.name)=lower(v.event_name)
where not exists(select 1 from public.event_schedule s where s.event_date=v.event_date::date and s.start_time=v.start_time::time and s.venue=v.venue and coalesce(s.event_name,'')=v.event_name);

-- For ceremony rows that are not actual event records, event_id remains null.

-- ------------------------------------------------------------
-- FINAL ROLE VERIFICATION
-- ------------------------------------------------------------
select u.email,p.full_name,p.role
from auth.users u left join public.profiles p on p.id=u.id
where lower(u.email) in(lower('SEMAPHORE@NMAMIT.IN'),lower('TECH@NMAMIT.IN'))
order by u.email;

-- ============================================================
-- END
-- ============================================================

-- ============================================================
-- REQUIRED PRIVILEGES FOR PRIVATE EVENT HEAD CONTACTS
-- ============================================================
grant select on public.event_head_contacts to authenticated;
grant insert, update, delete on public.event_head_contacts to authenticated;

-- ============================================================
-- END AQUADESK
-- ============================================================
