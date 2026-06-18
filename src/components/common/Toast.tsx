'use client'
import { useEffect, useState } from 'react'
import { useUiStore } from '@/stores/uiStore'

export function Toast() {
  const toasts = useUiStore(s => s.toasts)
  const dismissToast = useUiStore(s => s.dismissToast)
  const [visible, setVisible] = useState<Set<string>>(new Set())

  useEffect(() => {
    toasts.forEach(t => {
      if (!visible.has(t.id)) {
        setVisible(prev => new Set(prev).add(t.id))
        setTimeout(() => {
          dismissToast(t.id)
          setVisible(prev => { const next = new Set(prev); next.delete(t.id); return next })
        }, 4000)
      }
    })
  }, [toasts, visible, dismissToast])

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2">
      {toasts.map(t => (
        <div key={t.id} className={`rounded-lg px-4 py-2 text-sm text-white shadow-lg transition-all ${t.type === 'error' ? 'bg-red-600' : t.type === 'success' ? 'bg-green-600' : 'bg-teal-600'}`}>
          {t.message}
        </div>
      ))}
    </div>
  )
}
