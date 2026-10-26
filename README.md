# Trxip

A travel expense tracker PWA. One trip at a time, amounts in a home and a foreign currency, data stored on the device. It works offline.

Live: https://trxip.vercel.app

- Domain language: [CONTEXT.md](CONTEXT.md)
- Decisions: [docs/adr](docs/adr)

## Features

- **Setup:** The first page asks for the currencies and the rate. A "What is Trxip?" section tells a new user what the app does. It is closed at the start.
- **Expenses:** Add, edit and delete an expense. Each expense has a date, a category, a description and an amount.
- **Two currencies:** Type the amount in the foreign currency, and the app converts it to the home currency. Type it in the home currency, and the foreign column stays blank.
- **Live rate:** The rate is foreign units per 1 home unit, for example 1 MYR = 32.68 JPY. A new rate converts all foreign expenses again. See [ADR 0002](docs/adr/0002-live-rate.md).
- **Days:** The Expenses screen groups expenses by date, newest day first, with a total for each day.
- **Summary:** The trip total and a total for each category, highest first.
- **Categories:** Transport, Food, Shopping, Tickets, Accommodation and Other at the start. Add, rename and delete them on the Config screen. A category that expenses use cannot be deleted.
- **Files:** Export a CSV for a spreadsheet. Back up to a JSON file, and restore it on this or another device. On a phone, the share sheet opens ("Save to Files" on iPhone).
- **Copy to another device:** Copy all data between devices with a QR code. The computer shows the code (Send or Receive), and the phone taps Scan code. The data is encrypted, and the code works one time, for 10 minutes. The receiving device replaces its data, and asks first if it has expenses. See [ADR 0003](docs/adr/0003-qr-transfer-through-encrypted-relay.md).
- **New trip:** Deletes all data: expenses, categories, currencies and rate. The default categories come back, and the setup page opens again.
- **Web layout:** At 1024px and wider, a top bar replaces the bottom bar. Expenses and Summary show side by side, and the expenses table has a category column. The expense form opens as a dialog. Press N to add an expense.

Totals are in the home currency. The app rounds each home amount first and then adds them, so the totals match a spreadsheet of the same rows.

## Install on a phone

- **iPhone:** Open the live link in Safari. Tap Share, then Add to Home Screen.
- **Android:** Open the live link in Chrome. Tap the menu, then Install app.

## Data

The app stores data only in the browser on the device (IndexedDB). There is no account, and no server stores the data. A copy to another device goes through a relay, encrypted, and the relay deletes it after the first read or after 10 minutes. Clearing the site data deletes the data. On iPhone, deleting the home-screen app also deletes its data. Back up often.

Sync with Supabase is planned. See [ADR 0001](docs/adr/0001-device-only-storage-first.md).

## Tech

Vite, React 19, TypeScript, Tailwind CSS 4, shadcn/ui, Dexie (IndexedDB), vite-plugin-pwa, Vitest, oxlint.

## Project layout

| Folder | Content |
|---|---|
| `api` | The transfer relay, a Vercel function. In dev, Vite serves it with memory in place of Upstash. |
| `src/domain` | Money rules: conversion, rounding, totals and CSV. Pure functions. |
| `src/storage` | The Dexie store and the backup format. All reads and writes of data go through it. |
| `src/lib` | Formatting, parsing, the file export and the transfer client (code, encryption, upload and download). |
| `src/hooks` | Live data (`useTripData`), the current screen (`useScreen`) and the web layout switch (`useWide`). |
| `src/components` | Shared parts of the UI. `ui/` holds the shadcn/ui components. |
| `src/screens` | The Setup, Expenses, Summary and Config screens. |

The tests cover `src/domain`, `src/storage`, the transfer client and the relay. The storage tests use fake-indexeddb. There are no UI tests.

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server. |
| `npm test` | Run the domain, storage and transfer tests. |
| `npm run test:watch` | Run the tests again on each change. |
| `npm run lint` | Check the code with oxlint. |
| `npm run build` | Type-check and build to `dist/`, with the service worker. |
| `npm run preview` | Serve the build to check the PWA. |
| `npm run generate-pwa-assets` | Make the app icons again from `public/favicon.svg`. |

## Deploy

Vercel builds the app from `main` on each push. Build command `npm run build`, output folder `dist`. The app uses hash routes (`#/summary`), so no rewrite rules are needed.

Vercel also deploys `api/transfer.ts` as a function. It needs an Upstash Redis store: in the Vercel project, open Storage, add Upstash for Redis from the Marketplace, and connect it to the project. This adds the store's URL and token as environment variables. The relay reads `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`, or `KV_REST_API_URL` and `KV_REST_API_TOKEN`. Redeploy after you connect it. Without a store, Copy to another device answers that it is not available.
