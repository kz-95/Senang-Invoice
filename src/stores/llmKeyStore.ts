import { create } from 'zustand'

interface LlmKeyStoreState {
  version: number
  bump: () => void
}

export const useLlmKeyStore = create<LlmKeyStoreState>((set) => ({
  version: 0,
  bump: () => set((s) => ({ version: s.version + 1 })),
}))
