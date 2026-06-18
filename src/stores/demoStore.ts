import { create } from 'zustand'

const DEMO_KEY = 'demo_unlocked'

interface DemoStoreState {
  unlocked: boolean
  unlock: () => void
  lock: () => void
}

const isUnlocked = () => {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(DEMO_KEY) === '1'
}

export const useDemoStore = create<DemoStoreState>((set) => ({
  unlocked: isUnlocked(),

  unlock: () => {
    localStorage.setItem(DEMO_KEY, '1')
    set({ unlocked: true })
  },

  lock: () => {
    localStorage.removeItem(DEMO_KEY)
    set({ unlocked: false })
  },
}))
