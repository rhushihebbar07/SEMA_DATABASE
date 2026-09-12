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
