import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Lang } from '@/lib/types'

type CaptureMode = 'camera' | 'voice' | 'manual'

interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
}

interface UiStoreState {
  lang: Lang
  captureMode: CaptureMode
  toasts: Toast[]
  setLang: (lang: Lang) => void
  setCaptureMode: (mode: CaptureMode) => void
  addToast: (toast: Toast) => void
  dismissToast: (id: string) => void
}

export const useUiStore = create<UiStoreState>()(
  persist(
    (set) => ({
      lang: 'en',
      captureMode: 'camera',
      toasts: [],
      setLang: (lang) => set({ lang }),
      setCaptureMode: (mode) => set({ captureMode: mode }),
      addToast: (toast) => set((state) => ({ toasts: [...state.toasts, toast] })),
      dismissToast: (id) => set((state) => ({ toasts: state.toasts.filter(t => t.id !== id) })),
    }),
    {
      name: 'senang-ui-store',
      partialize: (state) => ({ lang: state.lang }),
    }
  )
)
