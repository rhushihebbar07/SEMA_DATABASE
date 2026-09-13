# Changelog

## V13 / Admin Command Center
- Rebuilt the Super Admin panel into a task-first command center with sidebar navigation, module search, quick actions, and a compact workspace command deck.
- Added responsive desktop/tablet/mobile admin layouts.
- Added workspace search and filters for all/assigned/needs-assignment/TECH.
- Added per-workspace live people/present metrics and clearer assignment states.
- Added direct TECH preview from the admin command bar.
- Added 1st/2nd/3rd-place winner controls.
- Added `supabase-v13-final-repair.sql` to repair legacy V9/V10/V11/V12 databases, including the exact `event_winners(event_id, placement)` unique key required by the frontend upsert.
- The repair migration safely removes duplicate event/placement winner rows before creating the unique index, retaining the most recently marked row.
- Added compatibility repair for `public_site_content.key` and attendance upsert uniqueness.

## V6 — Attendance & Analytics Controls
- Added two-level attendance: registered team first, assigned participants second.
- Attendance roster now uses explicit `participant_event_participation`; selecting a college/event never shows unregistered people.
- Added Super Admin analytics-only Force Reset protected by `FORCE000`; it resets the analytics baseline without deleting colleges, participants, events, registrations, schedules, or attendance rows.

# AquaDesk 2.1.0

- Mobile-first professional admin control room with reliable internal scrolling.
- Detailed operational dashboard with participation, confirmations, attendance, sessions and recent activity.
- Server-side audit trigger captures every operational INSERT/UPDATE/DELETE.
- One-minute activity heartbeat records account activity and current page.
- Login/logout events are recorded.
- Realtime authenticated team chat with Supabase Realtime and active-user presence.
- Semaphore 2K26 secure splash/loading screen and recovery/error screen.
- Toast notifications for operational actions.
- Supabase RLS remains the security boundary; private contacts are not exposed to public users.
- GitHub Pages workflow updated to Node 24.

## V8 — Event Authorised Accounts + Profile Controls

- Added event-specific `event_authorised` role with `assigned_event_id`.
- Added ten event account mappings for CodeWave, Leviathan, Coral Canvas, Aqua Byte, Aquaverse, The Mega Pitch, Tide & Tailor, Submarine, Ocean Enigma, and Abyss Arena.
- Added server-side attendance security so event accounts can only write attendance for their assigned event.
- Added Profile and Switch User controls to the main AquaDesk header.
- Added Super Admin → Authorised Users view.
- Force Reset Statistics now uses the server-side `force_reset_analytics()` function.
- Dashboard Participation by Event and College Status analytics now respect the analytics reset baseline.
- Added `supabase-v8-final.sql` and `AUTHORIZED_USERS_SETUP.md`.

## V9 Event Workspaces
- Personalized event dashboards for all 10 event accounts.
- Admin event assignment control.
- TECH global read + attendance workspace without editing.
- Super Admin-only workspace preview/switcher.
- Event-scoped attendance and winner marking with RLS.
- Winner persistence per event/placement.
- Analytics reset does not alter Confirmed/Pending/Denied college status.
