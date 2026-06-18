'use client'
import { useCallback, useState } from 'react'
import { checkScope } from '@/services/compliance/scopeEngine'

interface ScopeResult {
  inScope: boolean
  reason: string
}

export function useScopeCheck() {
  const [result, setResult] = useState<ScopeResult | null>(null)

  const run = useCallback((input: { annualTurnover: number; inCorporateGroup: boolean }) => {
    const r = checkScope(input)
    setResult(r)
    return r
  }, [])

  return { result, run }
}
