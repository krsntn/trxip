import type { Backup } from '@/storage'

/**
 * Copies all data from one device to another with a QR code (ADR 0003).
 * One device shows a code with a random ID and key. The other device scans it.
 * The data goes through the relay at /api/transfer, encrypted with the key, so the relay cannot read it.
 */

/** What the device that shows the code does: it sends its data, or it waits for data. */
export type CodeKind = 'send' | 'receive'

export interface TransferCode {
  kind: CodeKind
  id: string
  key: string
}

/** The relay keeps data for 10 minutes (api/transfer.ts). */
export const CODE_MINUTES = 10
const POLL_MS = 2000
const CODE = /^trxip:1:(send|receive):([\w-]{22})\.([\w-]{43})$/

/** The receiving device waited until the code expired. */
export class CodeExpiredError extends Error {
  constructor() {
    super('The code expired.')
  }
}

export function newCode(kind: CodeKind): TransferCode {
  return { kind, id: toBase64Url(randomBytes(16)), key: toBase64Url(randomBytes(32)) }
}

export const formatCode = ({ kind, id, key }: TransferCode) => `trxip:1:${kind}:${id}.${key}`

/** Null when the text is not a Trxip code. */
export function parseCode(text: string): TransferCode | null {
  const match = CODE.exec(text)
  return match ? { kind: match[1] as CodeKind, id: match[2], key: match[3] } : null
}

/** Encrypts the backup and stores it on the relay under the code's ID. */
export async function upload(code: TransferCode, backup: Backup): Promise<void> {
  const iv = randomBytes(12)
  const sealed = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, additionalData: encoder.encode(code.id) },
    await importKey(code.key),
    encoder.encode(JSON.stringify(backup)),
  )
  const body = new Uint8Array(iv.length + sealed.byteLength)
  body.set(iv)
  body.set(new Uint8Array(sealed), iv.length)

  const response = await request(code.id, { method: 'POST', body: toBase64Url(body) })
  if (response.status === 409) throw new Error('This code was already used. Show a new code on the other device.')
  if (!response.ok) throw relayError(response)
}

/**
 * Reads the data stored under the code's ID. The relay deletes it, so a code works one time.
 * With wait, it asks again every 2 seconds until the data comes or the code expires.
 * Returns the backup data unchecked. The store checks it before a restore.
 */
export async function download(
  code: TransferCode,
  { wait, signal }: { wait: boolean; signal?: AbortSignal },
): Promise<unknown> {
  const end = Date.now() + CODE_MINUTES * 60_000
  for (;;) {
    let response: Response | null = null
    try {
      response = await request(code.id, { signal, cache: 'no-store' })
    } catch (e) {
      // While it waits, a short loss of connection only skips one try.
      if (!wait || signal?.aborted) throw e
    }
    // 204: no data yet.
    if (response?.status === 200) return decrypt(code, await response.text())
    if (response && response.status !== 204) throw relayError(response)
    if (!wait) throw new Error('This code was already used, or it expired. Show a new code on the other device.')
    if (Date.now() > end) throw new CodeExpiredError()
    await sleep(POLL_MS, signal)
  }
}

async function decrypt(code: TransferCode, text: string): Promise<unknown> {
  try {
    const bytes = fromBase64Url(text)
    const plain = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: bytes.subarray(0, 12), additionalData: encoder.encode(code.id) },
      await importKey(code.key),
      bytes.subarray(12),
    )
    return JSON.parse(new TextDecoder().decode(plain))
  } catch {
    throw new Error('The data from the other device is damaged. Try again with a new code.')
  }
}

async function request(id: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(`/api/transfer?id=${id}`, init)
  } catch (e) {
    if ((e as DOMException).name === 'AbortError') throw e
    throw new Error('Trxip cannot connect to the internet. Check the connection and try again.')
  }
}

const relayError = (response: Response) =>
  new Error(
    response.status === 503
      ? 'Copy to another device is not available now. Use a backup file.'
      : `The copy failed (error ${response.status}). Try again.`,
  )

const encoder = new TextEncoder()

const importKey = (key: string) => crypto.subtle.importKey('raw', fromBase64Url(key), 'AES-GCM', false, ['encrypt', 'decrypt'])

const randomBytes = (length: number) => crypto.getRandomValues(new Uint8Array(length))

function toBase64Url(bytes: Uint8Array): string {
  let binary = ''
  // In parts, because a very long argument list overflows the stack.
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '')
}

const fromBase64Url = (text: string) =>
  Uint8Array.from(atob(text.replaceAll('-', '+').replaceAll('_', '/')), (c) => c.charCodeAt(0))

function sleep(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, ms)
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timer)
        reject(signal.reason)
      },
      { once: true },
    )
  })
}
