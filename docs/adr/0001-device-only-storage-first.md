# Device-only storage first, Supabase sync later

The first version stores all data in the browser (IndexedDB) on one device, with no account and no server. This keeps the app fully offline, free to host as a static site, and small. Supabase sync is planned for a later version.

## Consequences

- Data is lost if the device is lost or the browser data is cleared. File export is the only backup.
- To make the later Supabase change smaller, records use client-generated UUIDs (not auto-increment numbers), and all reads and writes go through one storage module.
