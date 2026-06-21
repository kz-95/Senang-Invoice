'use client'
import { useCallback, useState } from 'react'
import { useInvoiceStore } from '@/stores/invoiceStore'
import { useProfileStore } from '@/stores/profileStore'
import { useUiStore } from '@/stores/uiStore'
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
    const addToast = useUiStore.getState().addToast

    if (!profile) {
      const msg = 'Seller profile required. Set up your profile in Settings first.'
      setError(msg)
      addToast({ id: crypto.randomUUID(), message: msg, type: 'error' })
      return null
    }
    if (lines.length === 0) {
      const msg = 'At least one line item required'
      setError(msg)
      addToast({ id: crypto.randomUUID(), message: msg, type: 'error' })
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
        const msg = 'No numbering preset configured'
        setError(msg)
        addToast({ id: crypto.randomUUID(), message: msg, type: 'error' })
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
        const msg = validation.error ?? 'Submission failed — check MyInvois credentials in Settings'
        setError(msg)
        useUiStore.getState().addToast({ id: crypto.randomUUID(), message: msg, type: 'error' })
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
      const msg = err instanceof Error ? err.message : 'Finalization failed'
      setError(msg)
      useUiStore.getState().addToast({ id: crypto.randomUUID(), message: msg, type: 'error' })
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return { finalize, loading, error }
}
