import { afterEach, describe, expect, it, vi } from 'vitest'
import { buildBackup } from '@/storage'
import { download, formatCode, newCode, parseCode, upload } from './transfer'

/** A relay with the same rules as api/transfer.ts: store one time, read one time. It records what it stores. */
function fakeRelay() {
  const values = new Map<string, string>()
  vi.stubGlobal('fetch', async (url: string, init?: RequestInit) => {
    const id = new URL(url, 'http://app.test').searchParams.get('id')!
    if (init?.method === 'POST') {
      if (values.has(id)) return new Response(null, { status: 409 })
      values.set(id, init.body as string)
      return new Response(null, { status: 201 })
    }
    const value = values.get(id)
    values.delete(id)
    return value === undefined ? new Response(null, { status: 204 }) : new Response(value)
  })
  return values
}

const backup = buildBackup(
  { homeCurrency: 'MYR', foreignCurrency: 'JPY', rate: 32.68 },
  [{ id: 'food', name: 'Food', order: 0 }],
  [{ id: 'e1', date: '2026-11-14', categoryId: 'food', description: 'ramen', amount: 1200, currency: 'foreign', createdAt: 1 }],
)

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('transfer', () => {
  it('reads back a code it wrote, and rejects other text', () => {
    const code = newCode('receive')

    expect(parseCode(formatCode(code))).toEqual(code)
    expect(parseCode('https://example.com')).toBeNull()
    expect(parseCode(formatCode(code).slice(0, -1))).toBeNull()
  })

  it('sends a backup that the relay cannot read, and the other device reads it one time', async () => {
    const relay = fakeRelay()
    const code = newCode('send')

    await upload(code, backup)

    const stored = relay.get(code.id)!
    expect(stored).not.toContain('ramen')
    expect(await download(code, { wait: false })).toEqual(backup)
    await expect(download(code, { wait: false })).rejects.toThrow('already used')
  })

  it('does not read the data with a different key', async () => {
    fakeRelay()
    const code = newCode('send')
    await upload(code, backup)

    await expect(download({ ...code, key: newCode('send').key }, { wait: false })).rejects.toThrow('damaged')
  })

  it('waits for the data when the device shows a receive code', async () => {
    fakeRelay()
    vi.useFakeTimers()
    const code = newCode('receive')

    const received = download(code, { wait: true })
    await vi.advanceTimersByTimeAsync(4000)
    await upload(code, backup)
    await vi.advanceTimersByTimeAsync(2000)

    expect(await received).toEqual(backup)
    vi.useRealTimers()
  })
})
