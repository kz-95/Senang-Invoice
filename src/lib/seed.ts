import type { Invoice, SellerProfile, NumberPreset } from '@/lib/types'
import { invoiceRepository } from '@/services/data/invoiceRepository'
import { profileRepository } from '@/services/data/profileRepository'
import { llmKeyRepository } from '@/services/data/llmKeyRepository'
import { apiBase } from '@/lib/apiBase'
import { useLlmKeyStore } from '@/stores/llmKeyStore'

const demoNames: NumberPreset[] = [
  {
    id: 'demo-preset-1',
    name: 'Kedai Kopi',
    pattern: 'INV-KK-{seq:0000}',
    customTokens: {},
    reset: 'never',
    nextSeq: 1,
    isDefault: true,
  },
]

const demoProfile: SellerProfile = {
  id: 'demo-seller-1',
  businessName: 'Kedai Kopi Senang',
  tin: 'C1234567890',
  sstReg: 'W10-1234-56789012',
  msicCode: '56111',
  address: '12, Jalan Bahagia, Taman Gembira, 58200 Kuala Lumpur',
  phone: '+6012-345-6789',
  email: 'kedai@senang.my',
  numberingPresets: demoNames,
}

const demoInvoices: Invoice[] = [
  {
    id: 'demo-inv-1',
    number: 'INV-0001',
    docType: '01',
    createdAt: new Date('2026-06-15T10:30:00+08:00').toISOString(),
    status: 'validated',
    seller: demoProfile,
    buyer: { type: 'general' },
    lines: [
      {
        description: 'Nasi Lemak Biasa', qty: 3, uom: 'C62', unitPrice: 5.5,
        amount: 16.5, classificationCode: '022', taxType: '06', taxAmount: 0,
      },
      {
        description: 'Teh Tarik', qty: 2, uom: 'C62', unitPrice: 2.2,
        amount: 4.4, classificationCode: '022', taxType: '06', taxAmount: 0,
      },
    ],
    totals: { subtotal: 20.9, taxTotal: 0, total: 20.9 },
    ubl: { id: 'demo-ubl-1' },
    archived: false,
    numberConfigUsed: { presetId: 'demo-preset-1', pattern: 'INV-KK-{seq:0000}', tokenValues: {}, generatedNumber: 'INV-0001' },
    validation: {
      uuid: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      longId: 'DEMO123ABC',
      qrLink: 'https://preprod.myinvois.hasil.gov.my/a1b2c3d4-e5f6-7890-abcd-ef1234567890/share/DEMO123ABC',
      validatedAt: '2026-06-15T10:30:00+08:00',
      status: 'mock',
    },
  },
  {
    id: 'demo-inv-2',
    number: 'INV-0002',
    docType: '01',
    createdAt: new Date('2026-06-17T14:00:00+08:00').toISOString(),
    status: 'validated',
    seller: demoProfile,
    buyer: { type: 'tin', tin: 'C98765432109', name: 'Syarikat Ali Sdn Bhd', idType: 'BRN', idValue: '202401000001' },
    lines: [
      {
        description: 'Katering Makan Tengah Hari (50 pax)', qty: 1, uom: 'C62', unitPrice: 750,
        amount: 750, classificationCode: '022', taxType: '06', taxAmount: 0,
      },
    ],
    totals: { subtotal: 750, taxTotal: 0, total: 750 },
    ubl: { id: 'demo-ubl-2' },
    archived: false,
    numberConfigUsed: { presetId: 'demo-preset-1', pattern: 'INV-KK-{seq:0000}', tokenValues: {}, generatedNumber: 'INV-0002' },
    validation: {
      uuid: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
      longId: 'DEMO456DEF',
      qrLink: 'https://preprod.myinvois.hasil.gov.my/b2c3d4e5-f6a7-8901-bcde-f12345678901/share/DEMO456DEF',
      validatedAt: '2026-06-17T14:00:00+08:00',
      status: 'mock',
    },
  },
]

// Per-slot metadata for the seeded keys (labels/models/fallback ordering).
const SEED_KEY_META = [
  { label: 'Gemini Key 1', model: 'gemini-2.5-flash', isFallback: false },
  { label: 'Gemini Key 2', model: 'gemini-2.5-flash', isFallback: false },
  { label: 'DeepSeek', model: 'deepseek-v4-flash', isFallback: true },
]

async function seedLlmKeys(): Promise<void> {
  // Keys come from the server-only SENANG_LLM_KEYS env var via a localhost-guarded
  // route - NOT from NEXT_PUBLIC_* vars (which would be inlined into the browser
  // bundle and readable by anyone). See src/app/api/seed-keys/route.ts.
  let entries: Array<{ provider: string; apiKey: string }> = []
  try {
    const res = await fetch(`${apiBase()}/api/seed-keys`)
    if (res.ok) {
      const data = (await res.json()) as { keys?: Array<{ provider: string; apiKey: string }> }
      entries = data.keys ?? []
    }
  } catch {
    // No local backend reachable (offline / static export) - skip key seeding.
  }

  if (entries.length === 0) return

  const rows = entries.map((entry, i) => ({
    id: crypto.randomUUID(),
    label: SEED_KEY_META[i]?.label ?? `LLM Key ${i + 1}`,
    provider: entry.provider,
    apiKey: entry.apiKey,
    model: SEED_KEY_META[i]?.model ?? 'gemini-2.5-flash',
    isActive: true,
    isFallback: SEED_KEY_META[i]?.isFallback ?? false,
    priority: i,
    createdAt: new Date().toISOString(),
  }))

  for (const row of rows) {
    await llmKeyRepository.save(row)
  }
  useLlmKeyStore.getState().bump()
}

export async function seedDemoData(): Promise<void> {
  await seedLlmKeys()
  await profileRepository.save(demoProfile)
  for (const invoice of demoInvoices) {
    await invoiceRepository.save(invoice)
  }
}
