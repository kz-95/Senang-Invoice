import { create } from 'zustand'

const DEMO_KEY = 'demo_unlocked'

interface DemoStoreState {
  unlocked: boolean
  unlock: () => void
  lock: () => void
  rehydrate: () => void
}

export const useDemoStore = create<DemoStoreState>((set) => ({
  unlocked: false,

  unlock: () => {
    localStorage.setItem(DEMO_KEY, '1')
    set({ unlocked: true })
  },

  lock: () => {
    localStorage.removeItem(DEMO_KEY)
    set({ unlocked: false })
  },

  rehydrate: () => {
    set({ unlocked: localStorage.getItem(DEMO_KEY) === '1' })
  },
}))
