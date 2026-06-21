import { describe, it, expect } from 'vitest'
import { extractLineItems } from './extractionService'

const fakeClient = {
  messages: {
    create: async (_params: unknown) => ({
      content: [
        {
          type: 'text',
          text: JSON.stringify([
            { description: 'Nasi Lemak', qty: 2, unitPrice: 8.5 },
            { description: 'Teh Tarik', qty: 1, unitPrice: 2.0 },
          ]),
        },
      ],
    }),
  },
}

test('extracts line items from transcript via fake client', async () => {
  const items = await extractLineItems(
    { transcript: 'two nasi lemak at 8.50 and one teh tarik at 2.00' },
    undefined, undefined, undefined, undefined,
    fakeClient as any
  )
  expect(items).toHaveLength(2)
  expect(items[0].description).toBe('Nasi Lemak')
  expect(items[0].qty).toBe(2)
  expect(items[0].unitPrice).toBe(8.5)
  expect(items[0].amount).toBe(17)
})

test('returns empty array when no input', async () => {
  const items = await extractLineItems({}, undefined, undefined, undefined, undefined, fakeClient as any)
  expect(items).toHaveLength(0)
})

test('returns empty array when Claude returns garbage', async () => {
  const badClient = {
    messages: { create: async () => ({ content: [{ type: 'text', text: 'not json' }] }) },
  }
  const items = await extractLineItems({ transcript: 'x' }, undefined, undefined, undefined, undefined, badClient as any)
  expect(items).toHaveLength(0)
})

describe('extractLineItems routing', () => {
  it('uses a generous max_tokens and the provided client for image input', async () => {
    const calls: any[] = []
    const fakeClient = {
      messages: {
        create: async (params: any) => {
          calls.push(params)
          return { content: [{ type: 'text', text: '[{"description":"Nasi","qty":2,"unitPrice":5}]' }] }
        },
      },
    }
    const items = await extractLineItems(
      { imageBase64: 'ZmFrZQ==' }, undefined, undefined, undefined, undefined, fakeClient as any
    )
    expect(items[0].description).toBe('Nasi')
    expect(calls[0].max_tokens).toBeGreaterThanOrEqual(2048)
  })
})
