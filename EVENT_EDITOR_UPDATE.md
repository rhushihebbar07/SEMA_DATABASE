# AquaDesk Event Editor Update

The Super Admin event editor now combines the event's public details, coordinator information and linked timetable in one edit view.

## Event Edit
- Event name, subtitle, logo and rules remain editable.
- Coordinator names and phone numbers are editable in the event record's `current_heads` field.
- The supplied Semaphore 2K26 brochure coordinator details are shown as a reference.
- A **Use brochure details** action can copy the official coordinator list into the editable field.
- All live `event_schedule` rows linked to the event are loaded into the same editor.
- Schedule rows can be added, edited or removed.
- The supplied brochure timetable for that event is shown as a reference.
- If the event has no DB timetable rows, **Load official brochure schedule into database editor** copies the official timetable into editable rows.
- Saving the event saves the event data and its timetable together and writes an audit entry.

## Mobile-first
The event editor uses stacked fields and full-width controls on small screens so the complete schedule can be edited comfortably from a phone.
