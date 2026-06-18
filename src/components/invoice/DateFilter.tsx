'use client'
import { useCallback } from 'react'
import { useT } from '@/hooks/useT'

interface DateFilterProps {
  fromDate: string
  toDate: string
  onFromChange: (value: string) => void
  onToChange: (value: string) => void
  onClear: () => void
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

function monthStartStr(): string {
  const d = new Date()
  d.setDate(1)
  return d.toISOString().slice(0, 10)
}

export function DateFilter({ fromDate, toDate, onFromChange, onToChange, onClear }: DateFilterProps) {
  const hasFilter = fromDate || toDate
  const t = useT()

  const setToday = useCallback(() => {
    const t = todayStr()
    onFromChange(t)
    onToChange(t)
  }, [onFromChange, onToChange])

  const setThisMonth = useCallback(() => {
    onFromChange(monthStartStr())
    onToChange(todayStr())
  }, [onFromChange, onToChange])

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <input type="date" value={fromDate} onChange={e => onFromChange(e.target.value)}
          className="flex-1 rounded-lg border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 min-w-0"
          aria-label="From date" />
        <span className="text-gray-400 text-xs flex-shrink-0">to</span>
        <input type="date" value={toDate} onChange={e => onToChange(e.target.value)}
          className="flex-1 rounded-lg border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 min-w-0"
          aria-label="To date" />
      </div>
      <div className="flex items-center gap-1.5">
        <button onClick={setToday}
          className="px-2 py-1 text-[11px] rounded-md border border-gray-200 hover:bg-teal-50 hover:border-teal-300 transition-colors text-gray-600">
          {t('dashboard.today')}
        </button>
        <button onClick={setThisMonth}
          className="px-2 py-1 text-[11px] rounded-md border border-gray-200 hover:bg-teal-50 hover:border-teal-300 transition-colors text-gray-600">
          {t('dashboard.thisMonth')}
        </button>
        {hasFilter && (
          <button onClick={onClear} className="text-[11px] text-teal-600 hover:text-teal-800 underline ml-auto">
            {t('dashboard.clearFilter')}
          </button>
        )}
      </div>
    </div>
  )
}
