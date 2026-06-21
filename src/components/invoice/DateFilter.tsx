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

function yearStartStr(): string {
  return `${new Date().getFullYear()}-01-01`
}

type PresetId = 'today' | 'thisMonth' | 'thisYear' | null

function detectPreset(from: string, to: string): PresetId {
  if (!from && !to) return null
  const t = todayStr()
  const ms = monthStartStr()
  const ys = yearStartStr()
  if (from === t && to === t) return 'today'
  if (from === ms && to === t) return 'thisMonth'
  if (from === ys && to === t) return 'thisYear'
  return null
}

export function DateFilter({ fromDate, toDate, onFromChange, onToChange, onClear }: DateFilterProps) {
  const hasFilter = !!(fromDate || toDate)
  const activePreset = detectPreset(fromDate, toDate)
  const t = useT()

  const setToday = useCallback(() => {
    const td = todayStr()
    onFromChange(td)
    onToChange(td)
  }, [onFromChange, onToChange])

  const setThisMonth = useCallback(() => {
    onFromChange(monthStartStr())
    onToChange(todayStr())
  }, [onFromChange, onToChange])

  const setThisYear = useCallback(() => {
    onFromChange(yearStartStr())
    onToChange(todayStr())
  }, [onFromChange, onToChange])

  const presetClass = (id: PresetId) =>
    `px-2 py-1 text-[11px] rounded-md border transition-colors flex-1 text-center ${
      activePreset === id
        ? 'border-teal-500 bg-teal-50 text-teal-700 font-medium'
        : 'border-gray-200 hover:bg-teal-50 hover:border-teal-300 text-gray-600'
    }`

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <input type="date" value={fromDate} onChange={e => onFromChange(e.target.value)}
          className="flex-[3] rounded-lg border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 min-w-0"
          aria-label="From date" />
        <span className="text-gray-400 text-xs flex-1 text-center">to</span>
        <input type="date" value={toDate} onChange={e => onToChange(e.target.value)}
          className="flex-[3] rounded-lg border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 min-w-0"
          aria-label="To date" />
      </div>
      <div className="flex items-center gap-1.5">
        <button onClick={setThisYear} className={presetClass('thisYear')}>
          {t('dashboard.thisYear')}
        </button>
        <button onClick={setThisMonth} className={presetClass('thisMonth')}>
          {t('dashboard.thisMonth')}
        </button>
        <button onClick={setToday} className={presetClass('today')}>
          {t('dashboard.today')}
        </button>
      </div>
    </div>
  )
}
