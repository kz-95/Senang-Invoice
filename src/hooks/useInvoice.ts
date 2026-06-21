'use client'
import { useCallback, useState } from 'react'
import { useInvoiceStore } from '@/stores/invoiceStore'
import { useProfileStore } from '@/stores/profileStore'
import { useUiStore } from '@/stores/uiStore'
import { buildUbl } from '@/services/invoice/ublBuilder'
import { myInvoisCredsRepository } from '@/services/data/myInvoisCredsRepository'
import { invoiceRepository } from '@/services/data/invoiceRepository'
import { safeRandomUUID } from '@/lib/crypto'
import { profileRepository } from '@/services/data/profileRepository'
import { syncRepository } from '@/services/data/syncRepository'
import { submissionQueueRepository } from '@/services/data/submissionQueue'
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
      addToast({ id: safeRandomUUID(), message: msg, type: 'error' })
      return null
    }
    if (lines.length === 0) {
      const msg = 'At least one line item required'
      setError(msg)
      addToast({ id: safeRandomUUID(), message: msg, type: 'error' })
      return null
    }

    setLoading(true)
    setError(null)

    try {
      const issuedAt = new Date().toISOString()
      const id = safeRandomUUID()

      await profileRepository.ensurePresets(profile)
      const presets = profile.numberingPresets
      const activePreset = presets.find(p => p.isDefault) ?? presets[0]
      if (!activePreset) {
        const msg = 'No numbering preset configured'
        setError(msg)
        addToast({ id: safeRandomUUID(), message: msg, type: 'error' })
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
      }

      let validation: import('@/lib/types').ValidationResult | null = null
      let submissionError: string | null = null

      try {
        const res = await fetch(`${apiBase()}/api/submit`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ ubl, codeNumber: number }),
        })
        validation = (await res.json()) as import('@/lib/types').ValidationResult
        if (!res.ok && !validation.error) {
          throw new Error(`Submission failed (HTTP ${res.status})`)
        }
        if (validation.error) {
          submissionError = validation.error
        }
      } catch (fetchErr) {
        submissionError = fetchErr instanceof Error ? fetchErr.message : 'Network error'
      }

      const isValid = validation && (validation.status === 'valid' || validation.status === 'mock')
      const isNetworkError = !validation && submissionError

      const invoice: Invoice = {
        id,
        number,
        docType: '01',
        createdAt: issuedAt,
        status: isValid ? 'validated' : isNetworkError ? 'pending_submission' : 'draft',
        seller: profile,
        buyer,
        lines,
        totals,
        discount: options.discount,
        payment: options.payment,
        supplierRef: options.supplierRef,
        notes: options.notes,
        ubl,
        validation: validation ?? undefined,
        submissionUid: validation?.submissionUid,
        archived: false,
        numberConfigUsed,
      }

      await invoiceRepository.save(invoice)

      if (isNetworkError) {
        await submissionQueueRepository.enqueue(invoice.id, ubl, number)
        const msg = 'Invoice saved locally — will retry submission when connection is available'
        useUiStore.getState().addToast({ id: safeRandomUUID(), message: msg, type: 'info' })
      } else if (submissionError) {
        setError(submissionError)
        useUiStore.getState().addToast({ id: safeRandomUUID(), message: submissionError, type: 'error' })
      } else if (isValid) {
        await submissionQueueRepository.removeByInvoiceId(invoice.id)
      }

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
      if (!submissionError) return invoice
      return invoice
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Finalization failed'
      setError(msg)
      useUiStore.getState().addToast({ id: safeRandomUUID(), message: msg, type: 'error' })
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const retryPending = useCallback(async (): Promise<number> => {
    const pending = await submissionQueueRepository.getPending()
    let succeeded = 0

    for (const item of pending) {
      try {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' }
        const creds = await myInvoisCredsRepository.get()
        if (creds) {
          headers['x-myinvois-client-id'] = creds.clientId
        }

        const res = await fetch(`${apiBase()}/api/submit`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ ubl: item.ubl, codeNumber: item.codeNumber }),
        })
        const validation = (await res.json()) as import('@/lib/types').ValidationResult
        if (!res.ok && !validation.error) {
          throw new Error(`Retry failed (HTTP ${res.status})`)
        }
        if (validation.error) {
          await submissionQueueRepository.markAttempted(item.id, validation.error)
          continue
        }

        await submissionQueueRepository.remove(item.id)
        const invoice = await invoiceRepository.getById(item.invoiceId)
        if (invoice) {
          invoice.status = validation.status === 'valid' || validation.status === 'mock' ? 'validated' : 'draft'
          invoice.validation = validation
          invoice.submissionUid = validation.submissionUid
          await invoiceRepository.save(invoice)
        }
        succeeded++
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Retry error'
        await submissionQueueRepository.markAttempted(item.id, msg)
      }
    }

    return succeeded
  }, [])

  return { finalize, retryPending, loading, error }
}
