import type { ValidationResult } from '@/lib/types'
import { safeGetRandomValues, safeRandomUUID } from '@/lib/crypto'

/**
 * MOCK validation service for MyInvois
 * This is a documented production-hardening boundary.
 * Real MyInvois submission/validation is NOT implemented here.
 */

function generateBase36String(length: number): string {
  const chars = '0123456789abcdefghijklmnopqrstuvwxyz'
  const bytes = safeGetRandomValues(length)
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars[bytes[i] % 36]
  }
  return result
}

export function mockValidate(ubl: object): ValidationResult {
  const uuid = safeRandomUUID()
  const longId = generateBase36String(16)
  const rawBase = process.env.NEXT_PUBLIC_MYINVOIS_BASE || 'https://preprod.myinvois.hasil.gov.my'
  const base = rawBase.replace(/\/+$/, '') // normalize trailing slash
  const qrLink = `${base}/${uuid}/share/${longId}`
  const validatedAt = new Date().toISOString()

  return { uuid, longId, qrLink, validatedAt, status: 'mock' }
}
