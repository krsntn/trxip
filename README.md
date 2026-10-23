# Trxip

A travel expense tracker PWA. One trip at a time, amounts in a home and a foreign currency, data stored on the device. It works offline.

Live: https://trxip.vercel.app

- Domain language: [CONTEXT.md](CONTEXT.md)
- Decisions: [docs/adr](docs/adr)

## Features

- **Expenses:** Add, edit and delete an expense. Each expense has a date, a category, a description and an amount.
- **Two currencies:** Type the amount in the foreign currency, and the app converts it to the home currency. Type it in the home currency, and the foreign column stays blank.
- **Live rate:** The rate is foreign units per 1 home unit, for example 1 MYR = 32.68 JPY. A new rate converts all foreign expenses again. See [ADR 0002](docs/adr/0002-live-rate.md).
- **Days:** The Expenses screen groups expenses by date, newest day first, with a total for each day.
- **Summary:** The trip total and a total for each category, highest first.
- **Categories:** Transport, Food, Shopping, Tickets, Accommodation and Other at the start. Add, rename and delete them on the Config screen. A category that expenses use cannot be deleted.
- **Files:** Export a CSV for a spreadsheet. Back up to a JSON file, and restore it on this or another device. On a phone, the share sheet opens ("Save to Files" on iPhone).
- **New trip:** Deletes all expenses. Categories, currencies and rate stay.

Totals are in the home currency. The app rounds each home amount first and then adds them, so the totals match a spreadsheet of the same rows.

## Install on a phone

- **iPhone:** Open the live link in Safari. Tap Share, then Add to Home Screen.
- **Android:** Open the live link in Chrome. Tap the menu, then Install app.

## Data

The app stores data only in the browser on the device (IndexedDB). There is no server and no account. Clearing the site data deletes the data. On iPhone, deleting the home-screen app also deletes its data. Back up often.

Sync with Supabase is planned. See [ADR 0001](docs/adr/0001-device-only-storage-first.md).

## Tech

Vite, React 19, TypeScript, Tailwind CSS 4, shadcn/ui, Dexie (IndexedDB), vite-plugin-pwa, Vitest, oxlint.

## Project layout

| Folder | Content |
|---|---|
| `src/domain` | Money rules: conversion, rounding, totals and CSV. Pure functions. |
| `src/storage` | The Dexie store and the backup format. All reads and writes of data go through it. |
| `src/lib` | Formatting, parsing and the file export. |
| `src/hooks` | Live data (`useTripData`) and the current screen (`useScreen`). |
| `src/components` | Shared parts of the UI. `ui/` holds the shadcn/ui components. |
| `src/screens` | The Setup, Expenses, Summary and Config screens. |

The tests cover `src/domain` and `src/storage`. The storage tests use fake-indexeddb. There are no UI tests.

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server. |
| `npm test` | Run the domain and storage tests. |
| `npm run test:watch` | Run the tests again on each change. |
| `npm run lint` | Check the code with oxlint. |
| `npm run build` | Type-check and build to `dist/`, with the service worker. |
| `npm run preview` | Serve the build to check the PWA. |
| `npm run generate-pwa-assets` | Make the app icons again from `public/favicon.svg`. |

## Deploy

Vercel builds the app from `main` on each push. Build command `npm run build`, output folder `dist`. The app uses hash routes (`#/summary`), so no rewrite rules are needed.
