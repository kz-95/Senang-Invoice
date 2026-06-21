'use client'
import type { Invoice } from '@/lib/types'
import { InvoiceCard } from './InvoiceCard'
import { EmptyState } from '@/components/common/EmptyState'
import { Spinner } from '@/components/common/Spinner'
import { Button } from '@/components/common/Button'
import { useT } from '@/hooks/useT'

interface InvoiceListProps {
  invoices: Invoice[]
  loading: boolean
  onCreateClick: () => void
  tab?: 'pending' | 'validated' | 'synced' | 'archived' | 'trash' | 'active'
  selectMode?: boolean
  selectedIds?: Set<string>
  onToggleSelect?: (id: string) => void
  onRefresh?: () => Promise<void>
}

export function InvoiceList({ invoices, loading, onCreateClick, tab, selectMode, selectedIds, onToggleSelect, onRefresh }: InvoiceListProps) {
  const t = useT()

  if (loading) return <Spinner className="h-8 w-8 mx-auto mt-8" />

  if (invoices.length === 0) {
    const emptyMessages: Record<string, { title: string; description: string }> = {
      active: { title: t('dashboard.noInvoices'), description: t('dashboard.noInvoicesDesc') },
      pending: { title: 'No pending invoices', description: 'Invoices that failed validation will appear here.' },
      validated: { title: t('dashboard.noInvoices'), description: t('dashboard.noInvoicesDesc') },
      synced: { title: 'No synced invoices', description: 'Invoices backed up to Google Drive will appear here.' },
      archived: { title: 'No archived invoices', description: 'Archived invoices will appear here.' },
      trash: { title: 'Trash is empty', description: 'Deleted invoices appear here for 30 days before permanent removal.' },
    }
    const fallback = { title: t('dashboard.noInvoices'), description: t('dashboard.noInvoicesDesc') }
    const msg = emptyMessages[tab ?? 'validated'] ?? fallback
    return (
      <EmptyState
        title={msg.title}
        description={msg.description}
        action={tab === 'active' || tab === 'validated' || tab === 'pending' || tab === 'synced' ? <Button onClick={onCreateClick}>{t('dashboard.createInvoice')}</Button> : undefined}
      />
    )
  }

  return (
    <div className="space-y-3">
      {invoices.map(inv => (
        <InvoiceCard
          key={inv.id}
          invoice={inv}
          tab={tab}
          selectMode={selectMode}
          selected={selectedIds?.has(inv.id) ?? false}
          onToggleSelect={onToggleSelect}
          onRefresh={onRefresh}
        />
      ))}
    </div>
  )
}
