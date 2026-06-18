'use client'
import { useEffect } from 'react'
import { useInvoiceListStore } from '@/stores/invoiceListStore'

export function useInvoiceList() {
  const invoices = useInvoiceListStore((s) => s.invoices)
  const loading = useInvoiceListStore((s) => s.loading)
  const refresh = useInvoiceListStore((s) => s.refresh)
  const remove = useInvoiceListStore((s) => s.remove)

  useEffect(() => {
    refresh()
  }, [refresh])

  return { invoices, loading, refresh, remove }
}
