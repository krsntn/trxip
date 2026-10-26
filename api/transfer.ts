/**
 * The transfer relay (ADR 0003). One device stores encrypted data under a random ID,
 * and the other device reads it one time. The key is only in the QR code, so the relay cannot read the data.
 *
 * POST /api/transfer?id=<id>  Stores the request body for 10 minutes. 409 if the ID is already in use.
 * GET  /api/transfer?id=<id>  Returns the stored body and deletes it. 204 if there is none yet.
 *                             (Not 404: the receiving device asks every 2 seconds, and browsers log each 404 as an error.)
 *
 * This file has no local imports, so Vercel can deploy it as it is.
 */

/** The two storage operations the relay needs. Production uses Upstash Redis. The dev server and the tests use memory. */
export interface Kv {
  /** Stores the value only if the key is free. Returns false if the key is in use. */
  setNew(key: string, value: string, seconds: number): Promise<boolean>
  /** Returns the value and deletes it, or null if there is none. */
  take(key: string): Promise<string | null>
}

export const TTL_SECONDS = 600
export const MAX_LENGTH = 1_000_000
/** 16 random bytes, base64url. */
const ID = /^[\w-]{22}$/

export async function handleTransfer(request: Request, kv: Kv | null): Promise<Response> {
  if (request.method !== 'GET' && request.method !== 'POST') {
    return new Response(null, { status: 405, headers: { allow: 'GET, POST' } })
  }
  const id = new URL(request.url).searchParams.get('id') ?? ''
  if (!ID.test(id)) return new Response('The transfer ID is not valid.', { status: 400 })
  if (!kv) return new Response('The transfer store is not set up.', { status: 503 })
  const key = `transfer:${id}`

  if (request.method === 'POST') {
    const body = await request.text()
    if (!body) return new Response('The body is empty.', { status: 400 })
    if (body.length > MAX_LENGTH) return new Response('The body is too large.', { status: 413 })
    const stored = await kv.setNew(key, body, TTL_SECONDS)
    return new Response(null, { status: stored ? 201 : 409 })
  }

  const value = await kv.take(key)
  if (value === null) return new Response(null, { status: 204, headers: { 'cache-control': 'no-store' } })
  return new Response(value, { headers: { 'content-type': 'text/plain', 'cache-control': 'no-store' } })
}

/** Upstash Redis through its REST API. Null when the Vercel project has no Upstash store. */
function upstashKv(): Kv | null {
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN
  if (!url || !token) return null

  async function command(...args: string[]): Promise<unknown> {
    const response = await fetch(url!, {
      method: 'POST',
      headers: { authorization: `Bearer ${token}` },
      body: JSON.stringify(args),
    })
    if (!response.ok) throw new Error(`Upstash returned ${response.status}.`)
    return ((await response.json()) as { result: unknown }).result
  }

  return {
    setNew: async (key, value, seconds) => (await command('SET', key, value, 'NX', 'EX', String(seconds))) === 'OK',
    take: async (key) => (await command('GETDEL', key)) as string | null,
  }
}

/** For the dev server and the tests. Same rules as Upstash, kept in memory. */
export function memoryKv(): Kv {
  const values = new Map<string, { value: string; expires: number }>()
  const live = (key: string) => {
    const entry = values.get(key)
    return entry && entry.expires > Date.now() ? entry : undefined
  }
  return {
    async setNew(key, value, seconds) {
      if (live(key)) return false
      values.set(key, { value, expires: Date.now() + seconds * 1000 })
      return true
    },
    async take(key) {
      const entry = live(key)
      values.delete(key)
      return entry ? entry.value : null
    },
  }
}

export function GET(request: Request) {
  return handleTransfer(request, upstashKv())
}

export function POST(request: Request) {
  return handleTransfer(request, upstashKv())
}
