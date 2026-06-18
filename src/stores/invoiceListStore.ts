import { create } from 'zustand'
import { invoiceRepository } from '@/services/data/invoiceRepository'
import type { Invoice } from '@/lib/types'

interface InvoiceListState {
  invoices: Invoice[]
  loading: boolean
  refresh: () => Promise<void>
  remove: (id: string) => Promise<void>
}

export const useInvoiceListStore = create<InvoiceListState>((set) => ({
  invoices: [],
  loading: true,

  refresh: async () => {
    set({ loading: true })
    const all = await invoiceRepository.getAll()
    set({ invoices: all, loading: false })
  },

  remove: async (id: string) => {
    await invoiceRepository.remove(id)
    const all = await invoiceRepository.getAll()
    set({ invoices: all })
  },
}))
