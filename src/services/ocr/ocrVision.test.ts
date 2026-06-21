import { describe, it, expect } from 'vitest'
import { ocrViaGemini } from './ocrVision'

describe('ocrViaGemini', () => {
  it('returns text + split lines from the vision client', async () => {
    const fakeClient = {
      messages: {
        create: async () => ({ content: [{ type: 'text', text: 'Nasi Lemak 5.00\nTeh Tarik 2.50' }] }),
      },
    }
    const out = await ocrViaGemini('ZmFrZQ==', fakeClient as any)
    expect(out.text).toContain('Nasi Lemak')
    expect(out.lines).toEqual(['Nasi Lemak 5.00', 'Teh Tarik 2.50'])
    expect(out.count).toBe(2)
  })
})
