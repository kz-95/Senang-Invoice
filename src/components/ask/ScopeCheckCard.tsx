'use client'
import { useState } from 'react'
import { useScopeCheck } from '@/hooks/useScopeCheck'
import { Button } from '@/components/common/Button'
import { Input } from '@/components/common/Input'
import { useT } from '@/hooks/useT'

export function ScopeCheckCard() {
  const { result, run } = useScopeCheck()
  const [turnover, setTurnover] = useState('')
  const [inGroup, setInGroup] = useState(false)
  const [checking, setChecking] = useState(false)
  const t = useT()

  const handleCheck = () => {
    setChecking(true)
    setTimeout(() => {
      run({ annualTurnover: Number(turnover) || 0, inCorporateGroup: inGroup })
      setChecking(false)
    }, 0)
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
      <h3 className="font-semibold text-gray-900">{t('ask.scopeCheckTitle')}</h3>
      <p className="text-sm text-gray-500">{t('ask.scopeCheckDesc')}</p>
      
      <Input
        label={t('ask.annualTurnover')}
        type="number"
        value={turnover}
        onChange={e => setTurnover(e.target.value)}
        placeholder="1500000"
      />
      
      <label htmlFor="corporate-group-checkbox" className="flex items-center gap-2 text-sm">
        <input
          id="corporate-group-checkbox"
          type="checkbox"
          checked={inGroup}
          onChange={e => setInGroup(e.target.checked)}
          className="rounded border-gray-300 text-teal-700 focus:ring-teal-500"
        />
        {t('ask.corporateGroupLabel')}
      </label>
      
      <Button onClick={handleCheck} size="sm" disabled={checking} loading={checking}>{t('ask.checkScope')}</Button>
      
      {result && (
        <div role="alert" aria-live="polite" className={`rounded-lg p-3 text-sm ${
          result.inScope ? 'bg-amber-50 text-amber-900 border border-amber-200' : 'bg-green-50 text-green-900 border border-green-200'
        }`}>
          <p className="font-semibold">{result.inScope ? t('ask.inScope') : t('ask.exempt')}</p>
          <p>{result.reason}</p>
        </div>
      )}
    </div>
  )
}
