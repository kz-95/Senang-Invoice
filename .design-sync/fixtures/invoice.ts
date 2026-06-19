// Shared preview fixtures (mock data only — bundled from source into previews,
// never shipped as a component). Realistic Malaysian e-invoice data.

export const mockLines = [
  { description: 'Consulting services — September', qty: 12, uom: 'HUR', unitPrice: 150, amount: 1800, classificationCode: '022', taxType: '01', taxAmount: 108, taxRate: 6, confidence: 0.98 },
  { description: 'Cloud hosting (annual)', qty: 1, uom: 'ANN', unitPrice: 2400, amount: 2400, classificationCode: '008', taxType: '01', taxAmount: 144, taxRate: 6, confidence: 0.91 },
  { description: 'On-site setup — Kuala Lumpur', qty: 2, uom: 'DAY', unitPrice: 500, amount: 1000, classificationCode: '022', taxType: '01', taxAmount: 60, taxRate: 6, confidence: 0.52 },
]

const seller = {
  id: 'seller-1',
  businessName: 'Senang Tech Sdn Bhd',
  tin: 'C12345678900',
  sstReg: 'W10-1808-31000123',
  msicCode: '62010',
  address: 'Level 8, Menara ABC, Jalan Ampang, 50450 Kuala Lumpur',
  phone: '+60 3-2168 8888',
  email: 'billing@senang.my',
  numberingPresets: [] as unknown[],
}

const buyer = {
  type: 'tin' as const,
  tin: 'C98765432100',
  name: 'Awesome Retail Sdn Bhd',
  idType: 'BRN' as const,
  idValue: '201901000123',
  address: 'No 12, Jalan SS2/24, 47300 Petaling Jaya, Selangor',
}

export function makeInvoice(overrides: Record<string, unknown> = {}) {
  return {
    id: 'inv-1001',
    number: 'INV-2026-0042',
    docType: '01',
    createdAt: '2026-06-12T09:30:00.000Z',
    status: 'validated',
    seller,
    buyer,
    lines: mockLines,
    totals: { subtotal: 5200, taxTotal: 312, total: 5512 },
    archived: false,
    ubl: null,
    ...overrides,
  }
}

export const mockInvoices = [
  makeInvoice(),
  makeInvoice({ id: 'inv-1000', number: 'INV-2026-0041', status: 'synced', totals: { subtotal: 980, taxTotal: 58.8, total: 1038.8 }, buyer: { ...buyer, name: 'Kopi Lab Enterprise' } }),
  makeInvoice({ id: 'inv-0999', number: 'INV-2026-0040', status: 'draft', totals: { subtotal: 320, taxTotal: 19.2, total: 339.2 }, buyer: { type: 'general' as const } }),
]
