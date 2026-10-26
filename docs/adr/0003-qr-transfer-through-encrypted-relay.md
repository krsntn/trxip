# QR transfer through an encrypted relay

A traveller enters a trip on the phone and then wants it on a computer, or the other way. A backup file works, but it needs several manual steps. So two devices can copy all data with a QR code: one device shows the code and the other scans it, and a phone always scans because it has a good camera. The data goes through a small relay (`api/transfer.ts`, a Vercel function with Upstash Redis), because a QR code holds at most about 3 KB and a trip backup is often larger. We did not use animated QR codes read by a webcam, because many computers have no webcam and laptop webcams read a phone screen badly.

The code has a random ID and a random AES-GCM key. The device that sends encrypts the backup with the key in the browser, so the relay stores only encrypted data and never gets the key. The relay keeps the data for 10 minutes and deletes it on the first read, so a code works one time.

This is a one-time copy, not a sync. The receiving device replaces all its data, like a restore, and asks first if it has expenses. It changes ADR 0001 only for transfers: data is still stored only on the device, and Supabase sync is still the plan for later.

## Consequences

- Both devices need internet for a transfer. Backup files still work offline.
- The Vercel project needs an Upstash Redis store. Without it, the relay answers 503 and the app tells the traveller to use a backup file.
- On iPhone, a home-screen app has its own storage, separate from Safari. So the scan happens in the app's own camera view, not in the Camera app, which opens links in Safari.
- Anyone who sees the code within its 10 minutes can use it. The receiving device asks before it replaces existing expenses.
