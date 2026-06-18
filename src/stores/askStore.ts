import { create } from 'zustand'
import type { AskMessage } from '@/lib/types'

interface AskStoreState {
  messages: AskMessage[]
  addMessage: (message: AskMessage) => void
  clearMessages: () => void
}

export const useAskStore = create<AskStoreState>((set) => ({
  messages: [],
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
  clearMessages: () => set({ messages: [] }),
}))
