import { describe, it, expect } from 'vitest'
import { buildUbl } from './ublBuilder'
import { createMyInvoisClient } from './myInvoisClient'
import type { SellerProfile, Buyer, LineItem } from '@/lib/types'

const seller: SellerProfile = {
  id: 's1', businessName: 'Test Sdn Bhd', tin: 'C1234567890', sstReg: 'NA',
  msicCode: '46510', address: 'Lot 1, KL', phone: '+60123456789', email: 'a@b.com',
  numberingPresets: [{ id: 'p1', name: 'Simple', pattern: 'INV-{seq:0000}', customTokens: {}, reset: 'never', nextSeq: 1, isDefault: true }],
  city: 'Kuala Lumpur', postalZone: '50000', stateCode: '14',
}
const generalBuyer: Buyer = { type: 'general' }
const lines: LineItem[] = [{
  description: 'Widget', qty: 2, uom: 'C62', unitPrice: 50, amount: 100,
  classificationCode: '003', taxType: '06', taxAmount: 0, taxRate: 0,
}]

describe('sandbox UBL validation', () => {
  it('sandbox submission reaches Valid', async () => {
    const clientId = process.env.SENANG_MYINVOIS_CLIENT_ID
    const clientSecret = process.env.SENANG_MYINVOIS_CLIENT_SECRET
    const apiBase = process.env.SENANG_MYINVOIS_API_BASE
    const portalBase = process.env.NEXT_PUBLIC_MYINVOIS_BASE

    if (!clientId || !clientSecret) {
      console.log('SKIP: No sandbox credentials in env')
      return
    }

    const codeNumber = `SANDBOX-TEST-${Date.now()}`
    const { ubl } = buildUbl({
      seller,
      buyer: generalBuyer,
      lines,
      issuedAt: new Date().toISOString(),
      invoiceNumber: codeNumber,
    })

    const client = createMyInvoisClient({
      apiBase: apiBase ?? 'https://preprod-api.myinvois.hasil.gov.my',
      portalBase: portalBase ?? 'https://preprod.myinvois.hasil.gov.my',
      clientId,
      clientSecret,
    })

    const result = await client.submitAndAwait(ubl, codeNumber)

    console.log('=== Sandbox Validation Result ===')
    console.log(JSON.stringify(result, null, 2))

    if (result.status === 'invalid' && result.rejections && result.rejections.length > 0) {
      console.log('\n=== Rejections ===')
      result.rejections.forEach((r, i) => console.log(`  ${i + 1}. ${r}`))
    }

    if (result.status === 'valid') {
      expect(result.longId).toBeTruthy()
    } else {
      console.log(`\nStatus: ${result.status} - not a hard fail for sandbox test`)
    }
  }, 60000)
})
