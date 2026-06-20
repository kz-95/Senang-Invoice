'use client'
import { useMemo, useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useInvoiceListStore } from '@/stores/invoiceListStore'
import { InvoiceList } from '@/components/invoice/InvoiceList'
import { StatTile } from '@/components/dashboard/StatTile'
import { DateFilter } from '@/components/invoice/DateFilter'
import { SearchBar, type SortField, type SortDir } from '@/components/invoice/SearchBar'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/common/Button'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { invoiceRepository } from '@/services/data/invoiceRepository'
import { syncRepository } from '@/services/data/syncRepository'
import { isGoogleAuthenticated } from '@/services/drive/driveAuth'
import { formatMYRWhole } from '@/lib/formatters'
import { useT } from '@/hooks/useT'
import type { Invoice } from '@/lib/types'

const DocIcon = <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/></svg>
const CheckIcon = <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
const RmIcon = <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>

type TabId = 'active' | 'archived' | 'trash'

export default function HomePage() {
  const invoices = useInvoiceListStore(s => s.invoices)
  const loading = useInvoiceListStore(s => s.loading)
  const refresh = useInvoiceListStore(s => s.refresh)
  const router = useRouter()
  const t = useT()

  const [activeTab, setActiveTab] = useState<TabId>('active')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const clearDateFilter = () => { setFromDate(''); setToDate('') }

  const [query, setQuery] = useState('')
  const [sortField, setSortField] = useState<SortField>('date')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const toggleSortDir = useCallback(() => {
    setSortDir(d => d === 'asc' ? 'desc' : 'asc')
  }, [])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [selectMode, setSelectMode] = useState(false)
  const [confirmHardDelete, setConfirmHardDelete] = useState(false)
  const [confirming, setConfirming] = useState(false)

  useEffect(() => { refresh() }, [refresh])

  useEffect(() => {
    invoiceRepository.purgeExpired()
    // Only pull from Drive if already signed in - never force the OAuth popup on load.
    isGoogleAuthenticated().then(authed => {
      if (authed) syncRepository.pullAllFromDrive().finally(() => refresh())
    })
  }, [])

  useEffect(() => {
    invoiceRepository.purgeExpired()
  }, [])

  const tabCounts = useMemo(() => {
    const active = invoices.filter(inv => !inv.archived && !inv.deletedAt)
    const archived = invoices.filter(inv => inv.archived && !inv.deletedAt)
    const trash = invoices.filter(inv => !!inv.deletedAt)
    return { active: active.length, archived: archived.length, trash: trash.length }
  }, [invoices])

  const tabInvoices = useMemo(() => {
    let result: Invoice[]
    switch (activeTab) {
      case 'archived':
        result = invoices.filter(inv => inv.archived && !inv.deletedAt)
        break
      case 'trash':
        result = invoices.filter(inv => !!inv.deletedAt)
        break
      default:
        result = invoices.filter(inv => !inv.archived && !inv.deletedAt)
    }

    if (fromDate || toDate) {
      result = result.filter(inv => {
        const d = new Date(inv.createdAt).toISOString().slice(0, 10)
        if (fromDate && d < fromDate) return false
        if (toDate && d > toDate) return false
        return true
      })
    }

    if (query.trim()) {
      const q = query.toLowerCase()
      result = result.filter(inv =>
        inv.seller.businessName.toLowerCase().includes(q) ||
        inv.id.toLowerCase().includes(q) ||
        inv.lines.some(l => l.description.toLowerCase().includes(q))
      )
    }

    result.sort((a, b) => {
      let cmp = 0
      switch (sortField) {
        case 'date': cmp = a.createdAt.localeCompare(b.createdAt); break
        case 'amount': cmp = a.totals.total - b.totals.total; break
        case 'business': cmp = a.seller.businessName.localeCompare(b.seller.businessName); break
      }
      return sortDir === 'asc' ? cmp : -cmp
    })

    return result
  }, [invoices, activeTab, fromDate, toDate, query, sortField, sortDir])

  const billableInvoices = useMemo(
    () => invoices.filter(inv => !inv.deletedAt),
    [invoices]
  )

  const validatedCount = billableInvoices.filter(i => i.status === 'validated' || i.status === 'synced').length
  const totalAmount = billableInvoices
    .filter(i => i.status !== 'draft')
    .reduce((sum, i) => sum + i.totals.total, 0)

  const hasFilter = fromDate || toDate || query.trim()

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const exitSelectMode = () => {
    setSelectMode(false)
    setSelectedIds(new Set())
  }

  const ids = Array.from(selectedIds)

  const handleBulkArchive = async () => {
    await invoiceRepository.bulkArchive(ids)
    exitSelectMode()
    refresh()
  }

  const handleBulkDelete = async () => {
    await invoiceRepository.bulkDelete(ids)
    exitSelectMode()
    refresh()
  }

  const handleBulkRestore = async () => {
    await invoiceRepository.bulkRestore(ids)
    exitSelectMode()
    refresh()
  }

  const handleBulkUnarchive = async () => {
    await invoiceRepository.bulkUnarchive(ids)
    exitSelectMode()
    refresh()
  }

  const handleBulkHardDelete = async () => {
    setConfirming(true)
    try {
      for (const id of ids) {
        await invoiceRepository.hardDelete(id)
      }
    } finally {
      setConfirming(false)
    }
    setConfirmHardDelete(false)
    exitSelectMode()
    refresh()
  }

  const tabs: { id: TabId; label: string; count: number }[] = [
    { id: 'active', label: t('dashboard.tabActive'), count: tabCounts.active },
    { id: 'archived', label: t('dashboard.tabArchived'), count: tabCounts.archived },
    { id: 'trash', label: t('dashboard.tabTrash'), count: tabCounts.trash },
  ]

  return (
    <div className="space-y-4">
      <PageHeader
        title={t('dashboard.title')}
        subtitle={t('dashboard.subtitle')}
        action={
          <div className="flex gap-1">
            {!selectMode ? (
              <button onClick={() => setSelectMode(true)} className="flex items-center justify-center w-11 h-11 rounded-full hover:bg-teal-50 active:bg-teal-100 transition-colors text-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2" aria-label="Select">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              </button>
            ) : (
              <button onClick={exitSelectMode} className="flex items-center gap-1 h-11 px-3 rounded-full bg-teal-50 hover:bg-teal-100 active:bg-teal-200 transition-colors text-teal-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2" aria-label="Cancel selection">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                Done
              </button>
            )}
            <button onClick={refresh} className="flex items-center justify-center w-11 h-11 rounded-full hover:bg-teal-50 active:bg-teal-100 transition-colors text-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2" aria-label="Refresh">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182"/>
              </svg>
            </button>
          </div>
        }
      />

      <DateFilter fromDate={fromDate} toDate={toDate} onFromChange={setFromDate} onToChange={setToDate} onClear={clearDateFilter} />

      <div className="grid grid-cols-3 gap-2">
        <StatTile label={t('dashboard.invoices')} value={billableInvoices.length} icon={DocIcon} />
        <StatTile label={t('dashboard.validated')} value={validatedCount} icon={CheckIcon} />
        <StatTile label={t('dashboard.total')} value={`RM ${formatMYRWhole(totalAmount)}`} icon={RmIcon} />
      </div>

      <SearchBar query={query} onQueryChange={setQuery} sortField={sortField} onSortFieldChange={setSortField} sortDir={sortDir} onSortDirToggle={toggleSortDir} />

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200" role="tablist">
        {tabs.map(tab => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => { setActiveTab(tab.id); exitSelectMode() }}
            className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 min-h-[44px] ${activeTab === tab.id ? 'border-teal-600 text-teal-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Bulk action bar */}
      {selectMode && ids.length > 0 && (
        <div className="flex flex-wrap gap-2 p-2 bg-teal-50 rounded-lg border border-teal-200">
          <span className="text-xs text-teal-700 self-center mr-2">{ids.length} selected</span>
          {activeTab === 'active' && (
            <>
              <Button size="sm" variant="outline" onClick={handleBulkArchive}>Archive ({ids.length})</Button>
              <Button size="sm" variant="ghost" onClick={handleBulkDelete}>Delete ({ids.length})</Button>
            </>
          )}
          {activeTab === 'archived' && (
            <>
              <Button size="sm" variant="outline" onClick={handleBulkUnarchive}>Unarchive ({ids.length})</Button>
              <Button size="sm" variant="ghost" onClick={handleBulkDelete}>Delete ({ids.length})</Button>
            </>
          )}
          {activeTab === 'trash' && (
            <>
              <Button size="sm" variant="outline" onClick={handleBulkRestore}>Restore ({ids.length})</Button>
              <Button size="sm" variant="ghost" onClick={() => setConfirmHardDelete(true)}>Delete Forever ({ids.length})</Button>
            </>
          )}
          <Button size="sm" variant="ghost" onClick={exitSelectMode}>Cancel</Button>
        </div>
      )}

      {hasFilter && (
        <p className="text-xs text-gray-500 -mb-2">
          {tabInvoices.length} of {tabCounts[activeTab]} invoice{tabCounts[activeTab] !== 1 ? 's' : ''}
        </p>
      )}

      <InvoiceList
        invoices={tabInvoices}
        loading={loading}
        onCreateClick={() => router.push('/create')}
        tab={activeTab}
        selectMode={selectMode}
        selectedIds={selectedIds}
        onToggleSelect={toggleSelect}
        onRefresh={refresh}
      />

      <ConfirmDialog
        open={confirmHardDelete}
        danger
        loading={confirming}
        title={`Delete ${ids.length} invoice${ids.length !== 1 ? 's' : ''} forever?`}
        message="This permanently removes the selected invoices. This cannot be undone."
        confirmLabel="Delete Forever"
        onConfirm={handleBulkHardDelete}
        onCancel={() => setConfirmHardDelete(false)}
      />
    </div>
  )
}
