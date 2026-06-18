'use client'
import { useT } from '@/hooks/useT'

interface SuggestedPromptsProps {
  onSelect: (text: string) => void
}

export function SuggestedPrompts({ onSelect }: SuggestedPromptsProps) {
  const t = useT()

  const suggestions = [
    t('ask.suggested1'),
    t('ask.suggested2'),
    t('ask.suggested3'),
    t('ask.suggested4'),
  ]
  return (
    <div className="grid w-full max-w-md grid-cols-1 gap-2 sm:grid-cols-2">
      {suggestions.map(s => (
        <button
          key={s}
          type="button"
          onClick={() => onSelect(s)}
          className="ripple min-h-[48px] rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-left text-sm text-gray-700 shadow-sm transition-colors hover:border-teal-300 hover:bg-teal-50 hover:text-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
        >
          {s}
        </button>
      ))}
    </div>
  )
}
