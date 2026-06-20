'use client'
import { useT } from '@/hooks/useT'

interface BulkActionBarProps {
  selectedCount: number
  onArchive: () => void
  onDelete: () => void
  onRestore?: () => void
  onCancel: () => void
  mode: 'active' | 'archived' | 'trash'
  loading?: boolean
}

export function BulkActionBar({
  selectedCount,
  onArchive,
  onDelete,
  onRestore,
  onCancel,
  mode,
  loading = false,
}: BulkActionBarProps) {
  const t = useT()
  if (selectedCount === 0) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-lg px-4 py-3 pb-safe">
      <div className="max-w-2xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
            aria-label="Cancel selection"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <span className="text-sm font-medium text-gray-700">
            {t('invoice.selectedCount', { n: selectedCount })}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {mode === 'active' && (
            <button
              onClick={onArchive}
              disabled={loading}
              className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-50"
            >
              {t('invoice.archive')}
            </button>
          )}
          {mode === 'archived' && onRestore && (
            <button
              onClick={onRestore}
              disabled={loading}
              className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-50"
            >
              {t('invoice.restore')}
            </button>
          )}
          <button
            onClick={onDelete}
            disabled={loading}
            className="px-3 py-1.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50"
          >
            {loading ? t('invoice.working') : mode === 'trash' ? t('invoice.deleteForever') : t('invoice.delete')}
          </button>
        </div>
      </div>
    </div>
  )
}
