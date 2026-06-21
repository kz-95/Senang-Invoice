'use client'
import type { InvoiceStatus } from '@/lib/types'
import { useT } from '@/hooks/useT'

interface StatusPillProps { status: InvoiceStatus }

export function StatusPill({ status }: StatusPillProps) {
  const t = useT()

  const labels: Record<InvoiceStatus, { text: string; className: string }> = {
    draft: { text: t('invoice.statusDraft'), className: 'bg-gray-100 text-gray-700' },
    validated: { text: t('invoice.statusValidated'), className: 'bg-success-100 text-success-800' },
    synced: { text: t('invoice.statusSynced'), className: 'bg-teal-100 text-teal-800' },
    cancelled: { text: t('invoice.statusCancelled'), className: 'bg-red-100 text-red-700' },
    pending_submission: { text: t('invoice.statusPendingSubmission'), className: 'bg-yellow-100 text-yellow-700' },
  }
  const { text, className } = labels[status]
  return (
    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${className}`}>
      {text}
    </span>
  )
}
