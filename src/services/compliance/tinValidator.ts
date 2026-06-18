import { Buyer } from '@/lib/types'
import { CONSOLIDATED_CODE } from '@/lib/constants'

export const isValidTinFormat = (tin: string) => /^[A-Z]{1,2}\d{8,12}$/.test(tin.trim())

export function assertBuyerAllowed(buyer: Buyer, classificationCode: string) {
  if (buyer.type === 'general' && classificationCode !== CONSOLIDATED_CODE)
    return { ok: false, error: 'ERR237' as const }
  if (buyer.type === 'tin' && !isValidTinFormat(buyer.tin))
    return { ok: false, error: 'ERR236' as const }
  return { ok: true as const }
}
