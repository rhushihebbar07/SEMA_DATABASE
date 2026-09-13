# AquaDesk V10 — Authorised Event Access

## Brochure mapping used

| Account | AquaDesk event | Brochure event |
|---|---|---|
| CODEWAVE@NMAMIT.IN | CodeWave | Coding |
| LEVIATHAN@NMAMIT.IN | Leviathan | IT Manager |
| CORALCANVAS@NMAMIT.IN | Coral Canvas | Web Design |
| AQUABYTE@NMAMIT.IN | Aqua Byte | IT Quiz |
| AQUAVERSE@NMAMIT.IN | Aquaverse | Tech Talk |
| MEGPITCH@NMAMIT.IN | The Mega Pitch | Startup Event |
| TIDETAILOR@NMAMIT.IN | Tide & Tailor | Fashion Show |
| SUBMARINE@NMAMIT.IN | Submarine | Photography & Videography |
| OCEANENIGMA@NMAMIT.IN | Ocean Enigma | Surprise Event |
| ABYSSARENA@NMAMIT.IN | Abyss Arena | Gaming / BGMI |
| TECH@NMAMIT.IN | All events | Technical access |

The brochure states the fest is on September 17 & 18, 2026 and gives the event rules and official schedule. The mapping above follows the event titles and the descriptions shown in the brochure pages 3–7. 

## Required Auth accounts

Create these in Supabase Authentication → Users. Use the same event-operator password supplied by the project owner for the ten event accounts. Do not store that password in the database or source code.

- CODEWAVE@NMAMIT.IN
- LEVIATHAN@NMAMIT.IN
- CORALCANVAS@NMAMIT.IN
- AQUABYTE@NMAMIT.IN
- AQUAVERSE@NMAMIT.IN
- MEGPITCH@NMAMIT.IN
- TIDETAILOR@NMAMIT.IN
- SUBMARINE@NMAMIT.IN
- OCEANENIGMA@NMAMIT.IN
- ABYSSARENA@NMAMIT.IN
- TECH@NMAMIT.IN
- SEMAPHORE@NMAMIT.IN

## V10 migration

Run:

`supabase-v10-event-access.sql`

after the base AquaDesk schema and analytics migration.

## Access model

- Event account: sees only participants registered for its assigned event, the participating colleges for that event, and event attendance/winners.
- TECH: global operational view and attendance/winners; no main-data editing.
- SEMAPHORE: Super Admin/full editing.
- Super Admin preview/switcher is a UI-only preview; it does not impersonate or expose another account's password/session.
- College Confirmed/Pending/Denied status is not touched by analytics reset.
- Force Reset Statistics changes the analytics baseline only.
