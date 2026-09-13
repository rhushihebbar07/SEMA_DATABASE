-- ============================================================
-- AQUADESK V11 - PUBLIC BROCHURE CONTENT
-- Public Rules + Coordinator page, editable by Super Admin.
-- Event-specific rules/heads remain in public.events and are
-- editable from the Admin > Events panel.
-- ============================================================

create table if not exists public.public_site_content (
  key text primary key,
  content text not null default '',
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

alter table public.public_site_content enable row level security;

drop policy if exists "public site content read" on public.public_site_content;
drop policy if exists "admin public site content write" on public.public_site_content;

create policy "public site content read"
on public.public_site_content
for select
to anon, authenticated
using (true);

create policy "admin public site content write"
on public.public_site_content
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

grant select on public.public_site_content to anon, authenticated;
grant insert, update, delete on public.public_site_content to authenticated;

insert into public.public_site_content(key,content)
values
('GENERAL_RULES', $$A team should consist of a maximum of 15 members.
The fest is open to all MCA students.
Teams must confirm their participation through our website: semaphore2k26.in
The registration fee is ₹2000 per team.
All participants must be present before 8:00 AM.
The overall championship will be decided based on the cumulative participation of each team across all events.
For the Fashion Show event, participants from other events can also join. However, those participating in IT Manager and Photography cannot participate in any other events.
Please check the timetable provided before registering for or participating in any event to avoid schedule clashes.
Participants are required to produce their college ID on the fest day.
The department/convenor reserves the right to take action in case of any misconduct.
The decisions of the judges will be final and binding.
For any issues regarding the payment of registration fees, please contact the core committee members.
A trophy will be awarded to the overall champions and runners-up.
Participants must bring a permission letter from their respective colleges.
Participants must bring accessories such as pens, laptops, chargers, etc. themselves.$$),
('COORDINATORS', $$HOD - MCA — Dr. Mamatha Balipa
Assistant Professor GD III — Dr. Roshan D Suvaris
PRESIDENT — Vansh Shetty
SECRETARY — Vaibhav Jain
TECHNICAL COORDINATOR — Nikhil$$)
on conflict(key) do nothing;

notify pgrst, 'reload schema';

select key, content, updated_at from public.public_site_content order by key;

-- Seed brochure-derived event details only when the existing field is empty.
-- This preserves any event content that Super Admin has already customised.
with brochure(event_name, program_name, rules, heads) as (
  values
  ('CodeWave','Coding',$$Number of participants: 2.
Participants may use any one of the following: C, Java, or Python.
Basic knowledge of Data Structures & Algorithms is expected.
Internet, AI tools, and external assistance are not allowed.
Round-specific rules will be announced before each round.
This is a solo event, and each participant will compete individually.
Participants are expected to maintain professional and respectful conduct throughout the event.
Participants must follow the instructions given by the organizers during each round.
Any form of cheating, unfair practice, or misconduct will result in disqualification.
The decision of the judges and organizers will be final.$$, $$Havyas : 7483989780
Shashidhara : 7760770725$$),
  ('Leviathan','IT Manager',$$This is a solo event, and each participant will compete individually.
Participants are expected to maintain professional and respectful conduct throughout the event.
Participants must follow the instructions given by the organizers during each round.
Any form of cheating, unfair practice, or misconduct will result in disqualification.
The decision of the judges and organizers will be final.$$, $$Jathin : 6364058375
Hasth : 7338371775$$),
  ('Coral Canvas','Web Design',$$Participants: 2 participants per team.
Skills: Knowledge of HTML, CSS & JavaScript is required.
Tasks: Rounds and design tasks will be given on the spot.
Gadgets: Electronic gadgets are not allowed.
Decision: Rules and decisions of the organizers will be final.$$, $$Swasthik : 8951192848
Udith : 8088575178$$),
  ('Aqua Byte','IT Quiz',$$Participants: Each team shall consist of 2 participants.
Topics: Questions will cover General Knowledge, Technical Knowledge, Programming, IT, Computer Science, and other IT-related topics.
Gadgets: Mobile phones, smartwatches, and electronic gadgets are strictly prohibited.
Decision: The judges’ decision shall be final and binding.
Disqualification: Malpractice or violation of rules will lead to disqualification.$$, $$Thushar : 7019512573
Prathiksha : 6363428734$$),
  ('Aquaverse','Tech Talk',$$Participants: Each participant will compete individually.
Topics: The topic for each round will be disclosed a few minutes before it begins.
Decision: Judges’ decisions are final and binding.
Conduct: Participants must maintain respectful and professional behaviour.
Disqualification: Offensive language, inappropriate content, cheating, or disrespectful behaviour will lead to immediate disqualification.$$, $$Krupa : 8296612368
Hruthika : 9353480749$$),
  ('The Mega Pitch','Startup Event',$$Number of participants: 2.
Participants must bring their own laptops.
The details of each round will be disclosed on the spot.
The judges’ decision will be final.$$, $$Sumanth : 8748059243
Shahavez : 7349342520$$),
  ('Tide & Tailor','Fashion Show',$$Team & Theme: Each team must have 2 members and follow a corporate/professional theme.
Outfits: Wear formal, business casual, modern office, or power-dressing styles, with coordination between both members.
Stage Performance: 2+1 minutes on stage; confidence, posture, walking style, and overall presentation will be judged.
Event Requirements: Outfits must be college-event appropriate and professional. Submit music in advance, report before your assigned time, and judges’ decision is final.$$, $$Prapthi : 9632081932
Prathiksha : 9483505763$$),
  ('Submarine','Photography & Videography',$$Participants & Equipment: 1 participant per entry. DSLR/mirrorless cameras and Smartphones are allowed.
Location: All content must be captured within the NMAMIT Nitte campus.
Content Policy: AI-generated content, stock/pre-shot content, or AI-based replacements are strictly prohibited and may lead to disqualification.
Originality: All submitted content must be captured during the event and must be the participant’s own work.$$, $$Goutam : 9242288471
Bhargavi : 9632081787$$),
  ('Ocean Enigma','Surprise Event',$$Team: Each team consists of 2 participants.
Mystery: The event details will be revealed only at the venue.
Challenges: Surprise bonus challenges may appear at any time.
Gadgets: Electronic devices are not allowed.
Conduct: Some tasks are time-based; fair play and sportsmanship are required, and judges’ decisions are final.$$, $$Sameeksha: 7676292225
Dheemanth: 9480463974$$),
  ('Abyss Arena','Gaming / BGMI',$$Team: Each team must consist of 4 players.
Devices: Emulators, iPads, and triggers are not allowed; players must bring their own mobile devices and accessories.
Game Setup: Devices must support the latest game version, with all required maps downloaded.
Connectivity: Players should have their own internet connection as a backup.
Fair Play: Misconduct or unfair play will lead to disqualification, and organizers’ decisions are final.$$, $$Jithesh : 7619168599
Keerthan : 8792839166$$)
)
update public.events e
set
  description = coalesce(nullif(trim(e.description),''), b.program_name),
  rules = coalesce(nullif(trim(e.rules),''), b.rules),
  current_heads = coalesce(nullif(trim(e.current_heads),''), b.heads)
from brochure b
where lower(e.name)=lower(b.event_name);

notify pgrst, 'reload schema';
