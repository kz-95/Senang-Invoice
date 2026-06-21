import { describe, it, expect, vi } from 'vitest'
import { submitInvoice } from './submissionService'

const ubl = { Invoice: [] }
const creds = {
  clientId: 'cid', clientSecret: 'sec',
  apiBase: 'https://api.x', portalBase: 'https://portal.x',
}

describe('submitInvoice', () => {
  it('returns a mock result in mock mode without calling the client', async () => {
    const clientFactory = vi.fn()
    const res = await submitInvoice(ubl, 'INV-1', { mode: 'mock', clientFactory })
    expect(res.status).toBe('mock')
    expect(res.uuid).toBeTruthy()
    expect(res.qrLink).toContain('/share/')
    expect(clientFactory).not.toHaveBeenCalled()
  })

  it('delegates to the client in sandbox mode with the given creds', async () => {
    const submitAndAwait = vi.fn().mockResolvedValue({
      uuid: 'U1', longId: 'L1', qrLink: 'q', validatedAt: 't', status: 'valid', submissionUid: 'S1',
    })
    const clientFactory = vi.fn().mockReturnValue({ submitAndAwait })
    const res = await submitInvoice(ubl, 'INV-1', { mode: 'sandbox', creds, clientFactory })
    expect(res.status).toBe('valid')
    expect(clientFactory).toHaveBeenCalledWith(creds, undefined, undefined)
    expect(submitAndAwait).toHaveBeenCalledWith(ubl, 'INV-1')
  })

  it('returns an error result if sandbox mode has no creds', async () => {
    const res = await submitInvoice(ubl, 'INV-1', { mode: 'sandbox', clientFactory: vi.fn() })
    expect(res.status).toBe('invalid')
    expect(res.error).toMatch(/credentials/i)
  })
})
