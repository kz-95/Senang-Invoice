'use client'
import { ChatWindow } from '@/components/ask/ChatWindow'
import { ScopeCheckCard } from '@/components/ask/ScopeCheckCard'
import { Button } from '@/components/common/Button'
import { NoLlmBanner } from '@/components/common/NoLlmBanner'
import { useState } from 'react'
import { useT } from '@/hooks/useT'

export default function AskPage() {
  const [showScope, setShowScope] = useState(false)
  const t = useT()

  return (
    <div className="flex h-[calc(100dvh-8.5rem)] min-h-[440px] flex-col">
      <NoLlmBanner context="ask" />
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{t('ask.title')}</h2>
          <p className="mt-0.5 text-sm text-gray-500">{t('ask.subtitle')}</p>
        </div>
        <Button
          variant={showScope ? 'secondary' : 'outline'}
          size="sm"
          onClick={() => setShowScope(v => !v)}
          aria-expanded={showScope}
        >
          {t('ask.scopeCheck')}
        </Button>
      </div>

      {showScope && (
        <div className="mb-3">
          <ScopeCheckCard />
        </div>
      )}

      <ChatWindow />
    </div>
  )
}
