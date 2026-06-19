'use client'
import { useState } from 'react'
import { useInvoiceList } from '@/hooks/useInvoiceList'
import { seedDemoData } from '@/lib/seed'
import { invoiceRepository } from '@/services/data/invoiceRepository'
import { profileRepository } from '@/services/data/profileRepository'
import { llmKeyRepository } from '@/services/data/llmKeyRepository'
import { useDemoStore } from '@/stores/demoStore'
import { useLlmKeyStore } from '@/stores/llmKeyStore'

export function DemoBanner() {
  const { invoices, refresh } = useInvoiceList()
  const [loading, setLoading] = useState<'gen' | 'clear' | null>(null)
  const [dismissed, setDismissed] = useState(false)
  const unlocked = useDemoStore(s => s.unlocked)

  if (!unlocked || dismissed) return null

  const hasData = invoices.length > 0

  const generate = async () => {
    setLoading('gen')
    await seedDemoData()
    await refresh()
    setLoading(null)
  }

  const clear = async () => {
    setLoading('clear')
    await invoiceRepository.clearAll()
    await profileRepository.clear()
    await llmKeyRepository.clearAll()
    useLlmKeyStore.getState().bump()
    await refresh()
    setLoading(null)
  }

  return (
    <div className="bg-amber-50 border-b border-amber-200">
      <div className="max-w-2xl mx-auto px-4 py-1.5 flex items-center justify-between gap-2">
        <span className="text-xs text-amber-700">
          {hasData ? `${invoices.length} invoice${invoices.length !== 1 ? 's' : ''}` : 'No data — load demo'}
        </span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={generate}
            disabled={loading !== null}
            className="text-xs px-2 py-0.5 rounded bg-amber-200 text-amber-800 hover:bg-amber-300 disabled:opacity-50 transition-colors"
          >
            {loading === 'gen' ? 'Seeding...' : 'Generate'}
          </button>
          <button
            onClick={clear}
            disabled={loading !== null || !hasData}
            className="text-xs px-2 py-0.5 rounded border border-amber-300 text-amber-700 hover:bg-amber-100 disabled:opacity-30 transition-colors"
          >
            {loading === 'clear' ? 'Clearing...' : 'Clear'}
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="flex items-center justify-center w-11 h-11 rounded-lg text-amber-400 hover:text-amber-600 hover:bg-amber-100"
            aria-label="Dismiss"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
