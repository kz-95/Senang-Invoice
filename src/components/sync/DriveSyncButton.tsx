'use client'
import { useState } from 'react'
import { Button } from '@/components/common/Button'
import { pushToDrive } from '@/services/drive/driveSyncService'
import { invoiceRepository } from '@/services/data/invoiceRepository'
import type { Invoice } from '@/lib/types'

interface DriveSyncButtonProps {
  invoice: Invoice
}

export function DriveSyncButton({ invoice }: DriveSyncButtonProps) {
  const [syncing, setSyncing] = useState(false)
  const [synced, setSynced] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSync = async () => {
    setSyncing(true)
    setError(null)
    try {
      const result = await pushToDrive(invoice)
      const updated: Invoice = {
        ...invoice,
        status: 'synced',
        sync: { driveFileId: result.fileId, driveSyncedAt: new Date().toISOString() },
      }
      await invoiceRepository.save(updated)
      setSynced(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync failed')
    } finally {
      setSyncing(false)
    }
  }

  if (synced) {
    return (
      <span className="text-sm text-green-600 flex items-center gap-1">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg>
        Synced to Drive
      </span>
    )
  }

  return (
    <div className="space-y-1">
      <Button
        variant="outline"
        size="sm"
        onClick={handleSync}
        loading={syncing}
      >
        <span className="flex items-center gap-1.5">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5V18a2.25 2.25 0 002.25 2.25h13.5A2.25 2.25 0 0021 18v-1.5m-13.5-8.25V15m0 0l3-3m-3 3l-3-3m9-3V3.75m0 0L15.75 6.75M18 3.75L14.25 6.75"/></svg>
          Sync to Google Drive
        </span>
      </Button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
