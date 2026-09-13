# Semaphore 2K26 Events + Schedule UI Update

- Events and Schedule are now separate pages.
- Both use the same visual language: dark underwater glass cards, cyan borders and compact metadata.
- Event cards use a fixed logo art area with `object-fit: contain` and centered positioning.
- Broken/missing logo URLs do not render a blank logo box.
- Schedule shows only the 10 official competition events, grouped by Day 1 and Day 2.
- Registration/breakfast/inauguration/non-competition schedule items are not rendered as competition event cards.
- Events can be filtered by All Events / Day 1 / Day 2.
- Existing admin, authentication and Supabase files are retained.
