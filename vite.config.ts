/// <reference types="vitest/config" />
import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { defineConfig, type Plugin } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import { handleTransfer, memoryKv } from './api/transfer.ts'

/** Serves the transfer relay on the dev and preview servers. It keeps data in memory in place of Upstash. */
function transferRelay(): Plugin {
  const kv = memoryKv()
  async function relay(req: IncomingMessage, res: ServerResponse) {
    const chunks: Buffer[] = []
    for await (const chunk of req) chunks.push(chunk as Buffer)
    const request = new Request(new URL(req.url ?? '/', 'http://localhost'), {
      method: req.method,
      body: req.method === 'POST' ? Buffer.concat(chunks).toString() : undefined,
    })
    const response = await handleTransfer(request, kv)
    res.statusCode = response.status
    response.headers.forEach((value, name) => res.setHeader(name, value))
    res.end(await response.text())
  }
  return {
    name: 'trxip-transfer-relay',
    configureServer: (server) => void server.middlewares.use('/api/transfer', relay),
    configurePreviewServer: (server) => void server.middlewares.use('/api/transfer', relay),
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    transferRelay(),
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'favicon.ico', 'apple-touch-icon-180x180.png'],
      manifest: {
        name: 'Trxip',
        short_name: 'Trxip',
        description: 'Track travel expenses in your home and foreign currency.',
        theme_color: '#11161d',
        background_color: '#11161d',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Fonts are bundled, so the app works fully offline.
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  test: {
    environment: 'node',
  },
})
