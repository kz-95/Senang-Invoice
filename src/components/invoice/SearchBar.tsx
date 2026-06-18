'use client'
import { useT } from '@/hooks/useT'

export type SortField = 'date' | 'amount' | 'business'
export type SortDir = 'asc' | 'desc'

interface SearchBarProps {
  query: string
  onQueryChange: (v: string) => void
  sortField: SortField
  onSortFieldChange: (v: SortField) => void
  sortDir: SortDir
  onSortDirToggle: () => void
}

export function SearchBar({ query, onQueryChange, sortField, onSortFieldChange, sortDir, onSortDirToggle }: SearchBarProps) {
  const t = useT()

  const sortOptions: { value: SortField; label: string }[] = [
    { value: 'date', label: t('dashboard.sortDate') },
    { value: 'amount', label: t('dashboard.sortAmount') },
    { value: 'business', label: t('dashboard.sortBusiness') },
  ]
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 relative">
        <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/>
        </svg>
        <input
          type="text"
          value={query}
          onChange={e => onQueryChange(e.target.value)}
          placeholder={t('dashboard.searchPlaceholder')}
          aria-label="Search invoices"
          className="w-full rounded-lg border border-gray-300 pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
        />
      </div>

      <select
        value={sortField}
        onChange={e => onSortFieldChange(e.target.value as SortField)}
        className="rounded-lg border border-gray-300 px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
        aria-label="Sort by"
      >
        {sortOptions.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>

      <button
        onClick={onSortDirToggle}
        className="flex items-center justify-center w-8 h-8 rounded-lg border border-gray-300 hover:bg-gray-50 active:bg-gray-100 transition-colors"
        aria-label={sortDir === 'asc' ? 'Sort ascending' : 'Sort descending'}
      >
        <svg className={`w-4 h-4 text-gray-600 transition-transform ${sortDir === 'desc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 4.5h14.25M3 9h9.75M3 13.5h5.25m5.25-.75L17.25 9m0 0L21 12.75M17.25 9v12"/>
        </svg>
      </button>
    </div>
  )
}
