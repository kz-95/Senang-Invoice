'use client'

import Link from 'next/link'
import { useHasLlmKey } from '@/hooks/useHasLlmKey'

export function NoLlmBanner({ context }: { context: 'ask' | 'create' }) {
  if (useHasLlmKey()) return null

  const msg = context === 'ask'
    ? 'No AI key - showing raw knowledge snippets. Add a key for smart, multilingual answers.'
    : 'No AI key - auto-extract & auto-categorize are off. Use Manual entry, or add a key.'

  return (
    <div
      role="note"
      className="mx-4 mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800"
    >
      {msg}{' '}
      <Link href="/settings" className="font-semibold underline">
        Add one in Settings →
      </Link>
    </div>
  )
}
