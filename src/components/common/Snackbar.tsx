'use client'
import { useEffect } from 'react'
import { useUiStore } from '@/stores/uiStore'

export function Snackbar() {
  const toasts = useUiStore((s) => s.toasts)
  const dismissToast = useUiStore((s) => s.dismissToast)

  useEffect(() => {
    if (toasts.length > 0) {
      const timer = setTimeout(() => {
        dismissToast(toasts[0].id)
      }, 4000)
      return () => clearTimeout(timer)
    }
  }, [toasts, dismissToast])

  if (toasts.length === 0) return null

  const toast = toasts[0]

  return (
    <div className="fixed bottom-24 left-4 right-4 z-50 flex justify-center pointer-events-none">
      <div
        role="alert"
        className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-white shadow-lg max-w-sm w-full animate-[slideUp_200ms_ease-out] ${
          toast.type === 'error' ? 'bg-red-700' : toast.type === 'success' ? 'bg-green-700' : 'bg-gray-900'
        }`}
      >
        <span className="flex-1">{toast.message}</span>
        <button
          onClick={() => dismissToast(toast.id)}
          className="text-white/80 hover:text-white font-medium text-xs uppercase tracking-wide"
        >
          Dismiss
        </button>
      </div>

      <style jsx>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
