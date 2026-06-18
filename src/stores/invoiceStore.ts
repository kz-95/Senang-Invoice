import { create } from 'zustand'
import type { LineItem, Buyer } from '@/lib/types'

interface InvoiceStoreState {
  lines: LineItem[]
  buyer: Buyer
  addLine: (line: Omit<LineItem, 'amount'>) => void
  updateLine: (index: number, updates: Partial<Omit<LineItem, 'amount'>>) => void
  removeLine: (index: number) => void
  setBuyer: (buyer: Buyer) => void
  reset: () => void
}

const recomputeAmount = (line: LineItem): LineItem => ({
  ...line,
  amount: line.qty * line.unitPrice,
})

export const useInvoiceStore = create<InvoiceStoreState>((set) => ({
  lines: [],
  buyer: { type: 'general' },

  addLine: (line) =>
    set((state) => ({
      lines: [...state.lines, recomputeAmount({ ...line, amount: 0 })],
    })),

  updateLine: (index, updates) =>
    set((state) => ({
      lines: state.lines.map((line, i) =>
        i === index ? recomputeAmount({ ...line, ...updates }) : line
      ),
    })),

  removeLine: (index) =>
    set((state) => ({
      lines: state.lines.filter((_, i) => i !== index),
    })),

  setBuyer: (buyer) => set({ buyer }),

  reset: () => set({ lines: [], buyer: { type: 'general' } }),
}))
