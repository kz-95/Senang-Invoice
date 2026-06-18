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
  tab?: 'active' | 'archived' | 'trash'
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
      archived: { title: 'No archived invoices', description: 'Archived invoices will appear here.' },
      trash: { title: 'Trash is empty', description: 'Deleted invoices appear here for 30 days before permanent removal.' },
      active: { title: t('dashboard.noInvoices'), description: t('dashboard.noInvoicesDesc') },
    }
    const msg = emptyMessages[tab ?? 'active']
    return (
      <EmptyState
        title={msg.title}
        description={msg.description}
        action={tab === 'active' ? <Button onClick={onCreateClick}>{t('dashboard.createInvoice')}</Button> : undefined}
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
