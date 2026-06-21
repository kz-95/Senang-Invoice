import { create } from 'zustand'

const DEMO_KEY = 'demo_unlocked'

interface DemoStoreState {
  unlocked: boolean
  unlock: () => void
  lock: () => void
  rehydrate: () => void
}

export const useDemoStore = create<DemoStoreState>((set) => ({
  // Default demo ON for APK — only explicit lock disables it.
  unlocked: true,

  unlock: () => {
    localStorage.setItem(DEMO_KEY, '1')
    set({ unlocked: true })
  },

  lock: () => {
    localStorage.setItem(DEMO_KEY, '0')
    set({ unlocked: false })
  },

  rehydrate: () => {
    const val = localStorage.getItem(DEMO_KEY)
    // Default unlocked; only lock if user explicitly chose to lock.
    set({ unlocked: val !== '0' })
  },
}))
