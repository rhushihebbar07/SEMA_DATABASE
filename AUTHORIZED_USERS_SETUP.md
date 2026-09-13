# AquaDesk Event Authorised Users

The application now supports event-specific authorised accounts.

## Access model

Each event account can:

- View all public and authorised data available in AquaDesk.
- View college/participant private information allowed to signed-in users.
- Use the global Semaphore Live Chat with all signed-in users.
- Mark attendance at **Level 1 (team)** and **Level 2 (participant)**.
- Mark attendance **only for its assigned event**.
- Cannot edit colleges, participants, events, schedules, registrations, event participation, or other admin data.
- Cannot open the Super Admin Control Room.

## Accounts

Create these users in **Supabase Dashboard → Authentication → Users → Add user**.

Use password:

`NMAMITMCA@2026`

| Email | Assigned event |
|---|---|
| CODEWAVE@NMAMIT.IN | CodeWave |
| LEVIATHAN@NMAMIT.IN | Leviathan |
| CORALCANVAS@NMAMIT.IN | Coral Canvas |
| AQUABYTE@NMAMIT.IN | Aqua Byte |
| AQUAVERSE@NMAMIT.IN | Aquaverse |
| MEGPITCH@NMAMIT.IN | The Mega Pitch |
| TIDETAILOR@NMAMIT.IN | Tide & Tailor |
| SUBMARINE@NMAMIT.IN | Submarine |
| OCEANENIGMA@NMAMIT.IN | Ocean Enigma |
| ABYSSARENA@NMAMIT.IN | Abyss Arena |

After the Auth users are created, run `supabase-v8-final.sql` once. The SQL also automatically maps existing matching Auth users.

## Super Admin analytics reset

Password:

`FORCE000`

This changes only the analytics baseline. It does not delete colleges, participants, events, registrations, schedules, teams, or attendance records.

## Profile / Switch User

A signed-in user now gets an account menu in the AquaDesk header:

- **Profile** — shows account, role, assigned event, access level and chat access.
- **Switch user** — signs out and opens the login screen for another account.
- **Logout** — signs out normally.
