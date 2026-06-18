import type { ReactNode } from 'react'

interface StatTileProps {
  label: string
  value: string | number
  icon?: ReactNode
}

export function StatTile({ label, value, icon }: StatTileProps) {
  return (
    <dl className="m-0">
      <div
        className="bg-white rounded-lg border border-gray-200 p-4 flex flex-col items-center text-center"
        aria-label={`${label}: ${value}`}
      >
        {icon && <span className="w-5 h-5 mb-1">{icon}</span>}
        <dd className="text-2xl font-bold text-teal-700">{value}</dd>
        <dt className="text-xs text-gray-500 mt-1">{label}</dt>
      </div>
    </dl>
  )
}
