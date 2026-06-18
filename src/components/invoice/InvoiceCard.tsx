'use client'
import { useState } from 'react'
import Link from 'next/link'
import type { Invoice } from '@/lib/types'
import { StatusPill } from './StatusPill'
import { invoiceRepository } from '@/services/data/invoiceRepository'

interface InvoiceCardProps {
  invoice: Invoice
  tab?: 'active' | 'archived' | 'trash'
  selectMode?: boolean
  selected?: boolean
  onToggleSelect?: (id: string) => void
  onRefresh?: () => Promise<void>
}

function daysUntilPermanent(deletedAt: string): number {
  const TRASH_DAYS = 30
  const deleted = new Date(deletedAt)
  const expires = new Date(deleted.getTime() + TRASH_DAYS * 24 * 60 * 60 * 1000)
  const remaining = Math.ceil((expires.getTime() - Date.now()) / (24 * 60 * 60 * 1000))
  return Math.max(0, remaining)
}

function getSyncBadge(invoice: Invoice): { label: string; color: string } | null {
  if (!invoice.sync) return null
  if (invoice.sync.driveSyncedAt) {
    const localMod = invoice.sync.localModifiedAt
    const syncAt = invoice.sync.driveSyncedAt
    if (localMod && localMod > syncAt) {
      return { label: '\u2601 Modified', color: 'text-amber-600' }
    }
    return { label: '\u2601 Synced', color: 'text-green-600' }
  }
  return { label: '\u2601 Not backed up', color: 'text-gray-400' }
}

export function InvoiceCard({ invoice, tab, selectMode, selected, onToggleSelect, onRefresh }: InvoiceCardProps) {
  const [actionOpen, setActionOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const date = new Date(invoice.createdAt).toLocaleDateString('en-MY', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
  const syncBadge = getSyncBadge(invoice)
  const isTrash = tab === 'trash' || !!invoice.deletedAt

  const handleArchive = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setActionLoading('archive')
    try { await invoiceRepository.archive(invoice.id) } finally { setActionLoading(null) }
    onRefresh?.()
  }

  const handleUnarchive = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setActionLoading('unarchive')
    try { await invoiceRepository.unarchive(invoice.id) } finally { setActionLoading(null) }
    onRefresh?.()
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setActionLoading('delete')
    try { await invoiceRepository.softDelete(invoice.id) } finally { setActionLoading(null) }
    onRefresh?.()
  }

  const handleRestore = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setActionLoading('restore')
    try { await invoiceRepository.restoreFromTrash(invoice.id) } finally { setActionLoading(null) }
    onRefresh?.()
  }

  const handleHardDelete = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setActionLoading('hardDelete')
    try { await invoiceRepository.hardDelete(invoice.id) } finally { setActionLoading(null) }
    onRefresh?.()
  }

  const body = (
    <>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {selectMode && (
            <input
              type="checkbox"
              checked={selected ?? false}
              onChange={() => onToggleSelect?.(invoice.id)}
              onClick={e => e.stopPropagation()}
              className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
            />
          )}
          <span className="text-sm font-semibold text-gray-900 truncate max-w-[180px]">
            {invoice.number}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {syncBadge && <span className={`text-xs ${syncBadge.color}`}>{syncBadge.label}</span>}
          <StatusPill status={invoice.status} />
        </div>
      </div>
      <div className="text-xs text-gray-500 mb-1">{invoice.seller.businessName}</div>
      <div className="text-xs text-gray-500 mb-1">{date}</div>
      {isTrash && invoice.deletedAt && (
        <div className="text-xs text-amber-600 mb-1">
          {daysUntilPermanent(invoice.deletedAt)} days until permanent deletion
        </div>
      )}
      <div className="text-sm font-bold text-teal-700">
        RM {invoice.totals.total.toFixed(2)}
      </div>
      {invoice.validation && !isTrash && (
        <div className="mt-1 text-xs text-gray-400 truncate">
          {invoice.validation.longId}
        </div>
      )}
      {invoice.editedFields && invoice.editedFields.length > 0 && !isTrash && (
        <div className="mt-1 text-xs text-amber-600">Edited</div>
      )}

      {!selectMode && (
        <>
          <div className="mt-2 pt-2 border-t border-gray-100 flex gap-1 flex-wrap">
            {!isTrash && (
              <>
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); window.location.href = `/invoice/${invoice.id}` }}
                  className="flex-1 min-w-[44px] h-[44px] flex items-center justify-center gap-1 text-xs text-teal-700 hover:bg-teal-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
                  aria-label="Edit"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"/></svg>
                  Edit
                </button>
                {tab !== 'archived' ? (
                  <button onClick={handleArchive} disabled={actionLoading === 'archive'} className="flex-1 min-w-[44px] h-[44px] flex items-center justify-center gap-1 text-xs text-teal-700 hover:bg-teal-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50" aria-label="Archive">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"/></svg>
                    Archive
                  </button>
                ) : (
                  <button onClick={handleUnarchive} disabled={actionLoading === 'unarchive'} className="flex-1 min-w-[44px] h-[44px] flex items-center justify-center gap-1 text-xs text-teal-700 hover:bg-teal-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50" aria-label="Unarchive">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 8.25H7.5a2.25 2.25 0 00-2.25 2.25v9a2.25 2.25 0 002.25 2.25h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25H15m0-3l-3-3m0 0l-3 3m3-3V15"/></svg>
                    Unarchive
                  </button>
                )}
                <button onClick={handleDelete} disabled={actionLoading === 'delete'} className="flex-1 min-w-[44px] h-[44px] flex items-center justify-center gap-1 text-xs text-red-600 hover:bg-red-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50" aria-label="Delete">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/></svg>
                  Delete
                </button>
              </>
            )}
            {isTrash && (
              <>
                <button onClick={handleRestore} disabled={actionLoading === 'restore'} className="flex-1 min-w-[44px] h-[44px] flex items-center justify-center gap-1 text-xs text-teal-700 hover:bg-teal-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50" aria-label="Restore">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3"/></svg>
                  Restore
                </button>
                <button onClick={handleHardDelete} disabled={actionLoading === 'hardDelete'} className="flex-1 min-w-[44px] h-[44px] flex items-center justify-center gap-1 text-xs text-red-600 hover:bg-red-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50" aria-label="Delete Forever">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                  Delete Now
                </button>
              </>
            )}
          </div>
        </>
      )}
    </>
  )

  if (selectMode) {
    return (
      <div
        onClick={() => onToggleSelect?.(invoice.id)}
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggleSelect?.(invoice.id) } }}
        className={`block rounded-xl bg-white p-4 shadow-sm cursor-pointer transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-teal-500 ${selected ? 'ring-2 ring-teal-500' : ''}`}
      >
        {body}
      </div>
    )
  }

  return (
    <Link
      href={`/invoice/${invoice.id}`}
      className="block rounded-xl bg-white p-4 shadow-sm hover:shadow-md active:shadow transition-all duration-150 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
    >
      {body}
    </Link>
  )
}
