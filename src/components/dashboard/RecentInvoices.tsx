'use client'
import { useInvoiceList } from '@/hooks/useInvoiceList'
import { InvoiceCard } from '@/components/invoice/InvoiceCard'
import { Spinner } from '@/components/common/Spinner'

export function RecentInvoices() {
  const { invoices, loading } = useInvoiceList()

  if (loading) return <Spinner className="h-6 w-6 mx-auto mt-4" />

  const recent = invoices.slice(0, 5)

  if (recent.length === 0) return null

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-700">Recent Invoices</h3>
      {recent.map(inv => <InvoiceCard key={inv.id} invoice={inv} />)}
    </div>
  )
}
