-- AquaDesk V15.7: canonical editable master timetable
create table if not exists public.schedule_master (
  id uuid primary key default gen_random_uuid(),
  source_key text not null unique,
  event_id uuid null references public.events(id) on delete set null,
  event_name text not null,
  event_date date not null,
  start_time time not null,
  end_time time null,
  venue text not null default '',
  sort_order integer not null default 0,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.schedule_master enable row level security;
drop policy if exists "schedule master public read" on public.schedule_master;
drop policy if exists "schedule master admin insert" on public.schedule_master;
drop policy if exists "schedule master admin update" on public.schedule_master;
drop policy if exists "schedule master admin delete" on public.schedule_master;
create policy "schedule master public read" on public.schedule_master for select using (true);
create policy "schedule master admin insert" on public.schedule_master for insert to authenticated with check (public.is_admin());
create policy "schedule master admin update" on public.schedule_master for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "schedule master admin delete" on public.schedule_master for delete to authenticated using (public.is_admin());
grant select on public.schedule_master to anon, authenticated;
grant insert,update,delete on public.schedule_master to authenticated;

-- Official Semaphore 2K26 brochure timetable: 27 editable entries.
insert into public.schedule_master(source_key,event_name,event_date,start_time,end_time,venue,sort_order)
values
('2026-09-17|08:00|Registration & Breakfast|Auditorium Foyer','Registration & Breakfast','2026-09-17','08:00','09:00','Auditorium Foyer',1),
('2026-09-17|09:00|Inaugural Ceremony|Sambhram Auditorium','Inaugural Ceremony','2026-09-17','09:00','11:00','Sambhram Auditorium',2),
('2026-09-17|11:00|Tide & Tailor|Sambhram Auditorium','Tide & Tailor','2026-09-17','11:00','12:00','Sambhram Auditorium',3),
('2026-09-17|11:00|Coral Canvas|MCA Lab 1','Coral Canvas','2026-09-17','11:00','12:00','MCA Lab 1',4),
('2026-09-17|11:00|CodeWave|MCA Lab 2','CodeWave','2026-09-17','11:00','13:00','MCA Lab 2',5),
('2026-09-17|11:00|Leviathan|Netravathi Hall','Leviathan','2026-09-17','11:00','16:00','Netravathi Hall',6),
('2026-09-17|11:00|Submarine|Sowparnika','Submarine','2026-09-17','11:00','16:00','Sowparnika',7),
('2026-09-17|12:15|Ocean Enigma|LH 402','Ocean Enigma','2026-09-17','12:15','13:15','LH 402',8),
('2026-09-17|13:00|The Mega Pitch|Shambavi Hall','The Mega Pitch','2026-09-17','13:00','15:00','Shambavi Hall',9),
('2026-09-17|13:00|Aquaverse|Palguni Hall','Aquaverse','2026-09-17','13:00','14:30','Palguni Hall',10),
('2026-09-17|13:00|Abyss Arena|MCA Lab 3 & MCA Lab 4','Abyss Arena','2026-09-17','13:00','16:00','MCA Lab 3 & MCA Lab 4',11),
('2026-09-17|14:00|Ocean Enigma|Sambhram Auditorium','Ocean Enigma','2026-09-17','14:00','16:00','Sambhram Auditorium',12),
('2026-09-17|14:45|Coral Canvas|MCA Lab 1','Coral Canvas','2026-09-17','14:45','16:15','MCA Lab 1',13),
('2026-09-17|14:45|CodeWave|MCA Lab 2','CodeWave','2026-09-17','14:45','16:15','MCA Lab 2',14),
('2026-09-17|15:15|Aqua Byte|Robotics Lab','Aqua Byte','2026-09-17','15:15','16:15','Robotics Lab',15),
('2026-09-18|09:00|Aqua Byte|NC 36','Aqua Byte','2026-09-18','09:00','10:00','NC 36',16),
('2026-09-18|09:00|Aquaverse|Sambhram Auditorium','Aquaverse','2026-09-18','09:00','10:30','Sambhram Auditorium',17),
('2026-09-18|09:00|CodeWave|MCA Lab 2','CodeWave','2026-09-18','09:00','13:00','MCA Lab 2',18),
('2026-09-18|09:00|Submarine|Sowparnika','Submarine','2026-09-18','09:00','13:00','Sowparnika',19),
('2026-09-18|09:00|Leviathan|Netravathi Hall','Leviathan','2026-09-18','09:00','11:45','Netravathi Hall',20),
('2026-09-18|10:15|The Mega Pitch|Shambavi Hall','The Mega Pitch','2026-09-18','10:15','11:45','Shambavi Hall',21),
('2026-09-18|10:15|Coral Canvas|MCA Lab 1','Coral Canvas','2026-09-18','10:15','13:30','MCA Lab 1',22),
('2026-09-18|10:15|Abyss Arena|MCA Lab 4','Abyss Arena','2026-09-18','10:15','13:30','MCA Lab 4',23),
('2026-09-18|10:15|Ocean Enigma|LH 402','Ocean Enigma','2026-09-18','10:15','13:30','LH 402',24),
('2026-09-18|12:00|Aqua Byte|Sambhram Auditorium','Aqua Byte','2026-09-18','12:00','13:30','Sambhram Auditorium',25),
('2026-09-18|13:30|Leviathan|Sambhram / Sowparnika','Leviathan','2026-09-18','13:30','15:00','Sambhram / Sowparnika',26),
('2026-09-18|15:00|Valedictory Ceremony|Sambhram Auditorium','Valedictory Ceremony','2026-09-18','15:00',null,'Sambhram Auditorium',27)
on conflict (source_key) do nothing;

-- Best-effort event linking for competition rows. The public editor can still edit event_name even when a DB event has a different label.
update public.schedule_master sm set event_id=e.id
from public.events e
where sm.event_id is null and lower(regexp_replace(regexp_replace(coalesce(e.name,''),'&','and','g'),'[^a-zA-Z0-9]+',' ','g')) = lower(regexp_replace(regexp_replace(sm.event_name,'&','and','g'),'[^a-zA-Z0-9]+',' ','g'));

notify pgrst, 'reload schema';
