// The underscore keeps Vercel from deploying this file as a function.
import { describe, expect, it } from 'vitest'
import { handleTransfer, MAX_LENGTH, memoryKv } from './transfer.ts'

const id = 'AAAAAAAAAAAAAAAAAAAAAA'
const url = (transferId = id) => `http://relay.test/api/transfer?id=${transferId}`
const post = (body: string, transferId = id) => new Request(url(transferId), { method: 'POST', body })

describe('transfer relay', () => {
  it('stores data one time and returns it one time', async () => {
    const kv = memoryKv()

    expect((await handleTransfer(new Request(url()), kv)).status).toBe(204)
    expect((await handleTransfer(post('sealed'), kv)).status).toBe(201)
    expect((await handleTransfer(post('other'), kv)).status).toBe(409)

    const first = await handleTransfer(new Request(url()), kv)
    expect(first.status).toBe(200)
    expect(await first.text()).toBe('sealed')
    expect((await handleTransfer(new Request(url()), kv)).status).toBe(204)
  })

  it('rejects a bad ID, an empty or too large body, and other methods', async () => {
    const kv = memoryKv()

    expect((await handleTransfer(new Request(url('short')), kv)).status).toBe(400)
    expect((await handleTransfer(post(''), kv)).status).toBe(400)
    expect((await handleTransfer(post('x'.repeat(MAX_LENGTH + 1)), kv)).status).toBe(413)
    expect((await handleTransfer(new Request(url(), { method: 'DELETE' }), kv)).status).toBe(405)
  })

  it('says the store is not set up when there is no store', async () => {
    expect((await handleTransfer(new Request(url()), null)).status).toBe(503)
  })
})
