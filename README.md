# Trxip

A travel expense tracker PWA. One trip at a time, amounts in a home and a foreign currency, data stored on the device.

- Domain language: [CONTEXT.md](CONTEXT.md)
- Decisions: [docs/adr](docs/adr)

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server. |
| `npm test` | Run the domain and storage tests. |
| `npm run build` | Type-check and build to `dist/`, with the service worker. |
| `npm run preview` | Serve the build to check the PWA. |
| `npm run generate-pwa-assets` | Make the app icons again from `public/favicon.svg`. |

## Deploy

Vercel: import the repo, build command `npm run build`, output folder `dist`. The app uses hash routes (`#/summary`), so no rewrite rules are needed.
