'use client'
import { useCallback, useState } from 'react'
import { useInvoiceStore } from '@/stores/invoiceStore'
import { useProfileStore } from '@/stores/profileStore'
import { buildUbl } from '@/services/invoice/ublBuilder'
import { myInvoisCredsRepository } from '@/services/data/myInvoisCredsRepository'
import { invoiceRepository } from '@/services/data/invoiceRepository'
import { profileRepository } from '@/services/data/profileRepository'
import { syncRepository } from '@/services/data/syncRepository'
import { formatInvoiceNumber, cloneDefaultPresets } from '@/lib/numbering'
import { apiBase } from '@/lib/apiBase'
import type { Invoice } from '@/lib/types'

export interface FinalizeOptions {
  invoiceNumber?: string
  tokenValues?: Record<string, string>
  discount?: { amount: number; reason?: string }
  payment?: { method?: string; terms?: string; dueDate?: string }
  supplierRef?: string
  notes?: string
}

export function useInvoice() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const finalize = useCallback(async (options: FinalizeOptions = {}): Promise<Invoice | null> => {
    if (loading) return null

    const { lines, buyer } = useInvoiceStore.getState()
    const { profile } = useProfileStore.getState()

    if (!profile) {
      setError('Seller profile required')
      return null
    }
    if (lines.length === 0) {
      setError('At least one line item required')
      return null
    }

    setLoading(true)
    setError(null)

    try {
      const issuedAt = new Date().toISOString()
      const id = crypto.randomUUID()

      await profileRepository.ensurePresets(profile)
      const presets = profile.numberingPresets
      const activePreset = presets.find(p => p.isDefault) ?? presets[0]
      if (!activePreset) {
        setError('No numbering preset configured')
        return null
      }

      let number = options.invoiceNumber ?? ''
      let numberConfigUsed: Invoice['numberConfigUsed']

      if (!options.invoiceNumber) {
        const tokenValues = options.tokenValues ?? {}
        const { number: generated, newPreset } = formatInvoiceNumber(activePreset, tokenValues, issuedAt)
        number = generated

        numberConfigUsed = {
          presetId: activePreset.id,
          pattern: activePreset.pattern,
          tokenValues,
          generatedNumber: number,
        }

        await profileRepository.updatePreset(profile, activePreset.id, { nextSeq: newPreset.nextSeq, lastResetPeriod: newPreset.lastResetPeriod })
      } else {
        numberConfigUsed = {
          presetId: activePreset.id,
          pattern: activePreset.pattern,
          tokenValues: options.tokenValues ?? {},
          generatedNumber: number,
        }
      }

      const { ubl, totals } = buildUbl({
        seller: profile, buyer, lines, issuedAt, invoiceNumber: number,
        discount: options.discount,
        payment: options.payment,
        supplierRef: options.supplierRef,
        notes: options.notes,
      })

      const creds = await myInvoisCredsRepository.get()
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (creds) {
        headers['x-myinvois-client-id'] = creds.clientId
        headers['x-myinvois-client-secret'] = creds.clientSecret
      }

      const res = await fetch(`${apiBase()}/api/submit`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ ubl, codeNumber: number }),
      })
      const validation = (await res.json()) as import('@/lib/types').ValidationResult
      if (!res.ok || validation.error) {
        setError(validation.error ?? 'Submission failed')
        return null
      }

      const isValid = validation.status === 'valid' || validation.status === 'mock'

      const invoice: Invoice = {
        id,
        number,
        docType: '01',
        createdAt: issuedAt,
        status: isValid ? 'validated' : 'draft',
        seller: profile,
        buyer,
        lines,
        totals,
        discount: options.discount,
        payment: options.payment,
        supplierRef: options.supplierRef,
        notes: options.notes,
        ubl,
        validation,
        submissionUid: validation.submissionUid,
        archived: false,
        numberConfigUsed,
      }

      await invoiceRepository.save(invoice)

      // PDF is generated on demand (pdfService.downloadInvoicePdf), not at finalize.
      // Drive backup runs in the background; syncRepository persists sync metadata
      // (driveFileId/driveSyncedAt). On failure, mark the invoice as locally modified
      // so the next syncAll retries it.
      syncRepository.pushToDrive(invoice).catch(() => {
        invoiceRepository.getById(invoice.id).then(inv => {
          if (inv) {
            inv.sync = {
              ...(inv.sync ?? {}),
              localModifiedAt: new Date().toISOString(),
            }
            invoiceRepository.save(inv)
          }
        })
      })

      useInvoiceStore.getState().reset()
      return invoice
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Finalization failed')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return { finalize, loading, error }
}
