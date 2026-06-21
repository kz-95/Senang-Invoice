import type { Invoice, SellerProfile, NumberPreset } from '@/lib/types'
import { invoiceRepository } from '@/services/data/invoiceRepository'
import { profileRepository } from '@/services/data/profileRepository'

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
  address: '12, Jalan Bahagia, Taman Gembira',
  city: 'Kuala Lumpur',
  postalZone: '58200',
  stateCode: '14',
  phone: '+6012-345-6789',
  email: 'kedai@senang.my',
  numberingPresets: demoNames,
}

const demoInvoices: Invoice[] = [
  // --- PENDING (draft, not validated) ---
  {
    id: 'demo-inv-0',
    number: 'INV-0000',
    docType: '01',
    createdAt: new Date('2026-06-21T08:00:00+08:00').toISOString(),
    status: 'draft',
    seller: demoProfile,
    buyer: { type: 'general' },
    lines: [
      { description: 'Roti Canai', qty: 2, uom: 'C62', unitPrice: 2.5, amount: 5, classificationCode: '022', taxType: '06', taxAmount: 0 },
      { description: 'Teh O Ais Limau', qty: 1, uom: 'C62', unitPrice: 2.0, amount: 2, classificationCode: '022', taxType: '06', taxAmount: 0 },
    ],
    totals: { subtotal: 7, taxTotal: 0, total: 7 },
    ubl: { id: 'demo-ubl-0' },
    archived: false,
    numberConfigUsed: { presetId: 'demo-preset-1', pattern: 'INV-KK-{seq:0000}', tokenValues: {}, generatedNumber: 'INV-0000' },
  },
  // --- VALIDATED ---
  {
    id: 'demo-inv-1',
    number: 'INV-0001',
    docType: '01',
    createdAt: new Date('2026-06-15T10:30:00+08:00').toISOString(),
    status: 'validated',
    seller: demoProfile,
    buyer: { type: 'general' },
    lines: [
      { description: 'Nasi Lemak Biasa', qty: 3, uom: 'C62', unitPrice: 5.5, amount: 16.5, classificationCode: '022', taxType: '06', taxAmount: 0 },
      { description: 'Teh Tarik', qty: 2, uom: 'C62', unitPrice: 2.2, amount: 4.4, classificationCode: '022', taxType: '06', taxAmount: 0 },
    ],
    totals: { subtotal: 20.9, taxTotal: 0, total: 20.9 },
    ubl: { id: 'demo-ubl-1' },
    archived: false,
    numberConfigUsed: { presetId: 'demo-preset-1', pattern: 'INV-KK-{seq:0000}', tokenValues: {}, generatedNumber: 'INV-0001' },
    validation: { uuid: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', longId: 'DEMO123ABC', qrLink: 'https://preprod.myinvois.hasil.gov.my/a1b2c3d4-e5f6-7890-abcd-ef1234567890/share/DEMO123ABC', validatedAt: '2026-06-15T10:30:00+08:00', status: 'mock' },
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
      { description: 'Katering Makan Tengah Hari (50 pax)', qty: 1, uom: 'C62', unitPrice: 750, amount: 750, classificationCode: '022', taxType: '06', taxAmount: 0 },
    ],
    totals: { subtotal: 750, taxTotal: 0, total: 750 },
    ubl: { id: 'demo-ubl-2' },
    archived: false,
    numberConfigUsed: { presetId: 'demo-preset-1', pattern: 'INV-KK-{seq:0000}', tokenValues: {}, generatedNumber: 'INV-0002' },
    validation: { uuid: 'b2c3d4e5-f6a7-8901-bcde-f12345678901', longId: 'DEMO456DEF', qrLink: 'https://preprod.myinvois.hasil.gov.my/b2c3d4e5-f6a7-8901-bcde-f12345678901/share/DEMO456DEF', validatedAt: '2026-06-17T14:00:00+08:00', status: 'mock' },
  },
  // --- SYNCED ---
  {
    id: 'demo-inv-3',
    number: 'INV-0003',
    docType: '01',
    createdAt: new Date('2026-06-10T09:15:00+08:00').toISOString(),
    status: 'synced',
    seller: demoProfile,
    buyer: { type: 'general' },
    lines: [
      { description: 'Mee Goreng Mamak', qty: 5, uom: 'C62', unitPrice: 7, amount: 35, classificationCode: '022', taxType: '06', taxAmount: 0 },
      { description: 'Sirap Bandung', qty: 3, uom: 'C62', unitPrice: 3.5, amount: 10.5, classificationCode: '022', taxType: '06', taxAmount: 0 },
    ],
    totals: { subtotal: 45.5, taxTotal: 0, total: 45.5 },
    ubl: { id: 'demo-ubl-3' },
    archived: false,
    numberConfigUsed: { presetId: 'demo-preset-1', pattern: 'INV-KK-{seq:0000}', tokenValues: {}, generatedNumber: 'INV-0003' },
    validation: { uuid: 'c3d4e5f6-a7b8-9012-cdef-123456789012', longId: 'DEMO789GHI', qrLink: 'https://preprod.myinvois.hasil.gov.my/c3d4e5f6-a7b8-9012-cdef-123456789012/share/DEMO789GHI', validatedAt: '2026-06-10T09:15:00+08:00', status: 'mock' },
  },
  // --- ARCHIVED ---
  {
    id: 'demo-inv-4',
    number: 'INV-0004',
    docType: '01',
    createdAt: new Date('2026-05-20T16:45:00+08:00').toISOString(),
    status: 'validated',
    seller: demoProfile,
    buyer: { type: 'general' },
    lines: [
      { description: 'Nasi Goreng Kampung', qty: 1, uom: 'C62', unitPrice: 8, amount: 8, classificationCode: '022', taxType: '06', taxAmount: 0 },
    ],
    totals: { subtotal: 8, taxTotal: 0, total: 8 },
    ubl: { id: 'demo-ubl-4' },
    archived: true,
    numberConfigUsed: { presetId: 'demo-preset-1', pattern: 'INV-KK-{seq:0000}', tokenValues: {}, generatedNumber: 'INV-0004' },
    validation: { uuid: 'd4e5f6a7-b8c9-0123-defa-234567890123', longId: 'DEMO101JKL', qrLink: 'https://preprod.myinvois.hasil.gov.my/d4e5f6a7-b8c9-0123-defa-234567890123/share/DEMO101JKL', validatedAt: '2026-05-20T16:45:00+08:00', status: 'mock' },
  },
  // --- TRASH (deleted but not yet purged) ---
  {
    id: 'demo-inv-5',
    number: 'INV-0005',
    docType: '01',
    createdAt: new Date('2026-04-01T11:00:00+08:00').toISOString(),
    status: 'validated',
    seller: demoProfile,
    buyer: { type: 'general' },
    lines: [
      { description: 'Kopi O Kaw', qty: 2, uom: 'C62', unitPrice: 2.5, amount: 5, classificationCode: '022', taxType: '06', taxAmount: 0 },
    ],
    totals: { subtotal: 5, taxTotal: 0, total: 5 },
    ubl: { id: 'demo-ubl-5' },
    archived: false,
    deletedAt: new Date('2026-06-19T08:00:00+08:00').toISOString(),
    numberConfigUsed: { presetId: 'demo-preset-1', pattern: 'INV-KK-{seq:0000}', tokenValues: {}, generatedNumber: 'INV-0005' },
    validation: { uuid: 'e5f6a7b8-c9d0-1234-efab-345678901234', longId: 'DEMO202MNO', qrLink: 'https://preprod.myinvois.hasil.gov.my/e5f6a7b8-c9d0-1234-efab-345678901234/share/DEMO202MNO', validatedAt: '2026-04-01T11:00:00+08:00', status: 'mock' },
  },
]

export async function seedDemoData(): Promise<void> {
  await profileRepository.save(demoProfile)
  for (const invoice of demoInvoices) {
    await invoiceRepository.save(invoice)
  }
}
