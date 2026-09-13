# AquaDesk V15 Stability + Events Fix

## Frontend fixes
- Events no longer depend on exact database event labels.
- Aliases such as `IT QUIZ`, `Photography AND Videography`, `BGMI`, `Startup Event`, `Web Designing`, and `Coding` map to the official branded event.
- All ten official events are shown on the public Events page even if an older database has renamed/missing event rows; missing public rows use brochure data for display only.
- Schedule falls back to the brochure timetable when schedule rows are absent for an event.
- Non-event timetable entries such as Registration & Breakfast, Inaugural Ceremony and Valedictory Ceremony are not displayed as competition cards.
- Missing/broken event logos are completely omitted instead of showing broken or fake images.
- Time formatting is defined and safe.
- Public site content is optional during boot, so a missing `public_site_content` table no longer blanks the Events page.
- Realtime chat no longer attaches presence callbacks after subscribe; this removes the `cannot add presence callbacks ... after subscribe()` race.

## Supabase
Run `supabase-v15-stability-repair.sql` in Supabase SQL Editor and then refresh the app.

The migration does not create Supabase Auth users or passwords. Those remain managed in Supabase Authentication.
