# AquaDesk — Semaphore 2K26 Management Portal

A mobile-first aquatic event management portal for Semaphore 2K26.

## Features

- Public participating-college directory
- Public participant names and teams
- Public event details and official schedule
- Private HOD/coordinator contacts for authorised users
- College confirmation: Pending / Confirmed / Denied
- Super Admin full CRUD for colleges, participants, events and schedule
- College ↔ event participation matrix
- Authorised Present / Absent attendance marking by schedule slot
- Event and college logo uploads through Supabase Storage
- Audit history for administrative changes
- Supabase RLS security
- GitHub Pages compatible Vite build

## Supabase setup

1. Create the project in Supabase.
2. Open SQL Editor.
3. Run `supabase.sql` completely.
4. Create the two Auth users manually in Authentication → Users.
5. Run the role verification query at the end of `supabase.sql` if needed.

### Accounts

Super Admin:
- Email: SEMAPHORE@NMAMIT.IN
- Role: admin

Authorised:
- Email: TECH@NMAMIT.IN
- Role: authorised

Passwords should be created and stored only in Supabase Authentication. Do not put passwords in the frontend or GitHub.

## Environment

Create `.env` locally:

```env
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-publishable-key
```

## Run

```bash
npm install
npm run dev
```

Build:

```bash
npm run build
```

## Schedule source

The official 17–18 September 2026 schedule and event details included in `supabase.sql` are based on the supplied Semaphore 2K26 PDF. The Super Admin can edit all seeded records after setup.

## V5 deployment fix
Before deploying V5, run `supabase-repair-v5.sql` once in Supabase SQL Editor. It repairs the earlier `event_schedule` schema mismatch and ensures the participation and attendance tables exist with RLS enabled.

The local `.env` contains the publishable Supabase browser key requested for this project and is ignored by Git.

## Event Authorised Accounts (V8)

AquaDesk supports event-specific operational accounts. These accounts are **view-only for data editing**, have global live chat access, and can mark attendance only for their assigned event.

Run `supabase-v8-final.sql` after the base schema/migrations. Then create the Auth users listed in `AUTHORIZED_USERS_SETUP.md` with the supplied password. Their `profiles` rows are mapped automatically to the correct event.

### Event accounts

- `CODEWAVE@NMAMIT.IN` → CodeWave
- `LEVIATHAN@NMAMIT.IN` → Leviathan
- `CORALCANVAS@NMAMIT.IN` → Coral Canvas
- `AQUABYTE@NMAMIT.IN` → Aqua Byte
- `AQUAVERSE@NMAMIT.IN` → Aquaverse
- `MEGPITCH@NMAMIT.IN` → The Mega Pitch
- `TIDETAILOR@NMAMIT.IN` → Tide & Tailor
- `SUBMARINE@NMAMIT.IN` → Submarine
- `OCEANENIGMA@NMAMIT.IN` → Ocean Enigma
- `ABYSSARENA@NMAMIT.IN` → Abyss Arena

### Analytics reset

Super Admin Force Reset Statistics uses `FORCE000` and resets the analytics baseline only. It does not delete colleges, participants, events, registrations, schedules, teams, or attendance records.


## V13 database repair
If a database upgraded from an older AquaDesk version reports missing winner columns or `no unique or exclusion constraint matching the ON CONFLICT specification`, run `supabase-v13-final-repair.sql` once in Supabase SQL Editor. It preserves operational data and creates the exact unique key used by the winner upsert: `(event_id, placement)`.

## V15.7 master timetable
Run `supabase-schedule-master.sql` in Supabase SQL Editor. It creates the canonical `schedule_master` table and seeds all 27 timetable entries from the supplied Semaphore 2K26 brochure. Super Admin can edit every entry, including registration, inaugural ceremony, all competition slots, and valedictory.
