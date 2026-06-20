'use client'
import { useState } from 'react'
import { useT } from '@/hooks/useT'

const THRESHOLD = 1_000_000 // RM annual turnover e-invoice threshold

type Period = 'day' | 'week' | 'month' | 'year'
const MULTIPLIER: Record<Period, number> = { day: 365, week: 52, month: 12, year: 1 }
const PERIODS: Period[] = ['day', 'week', 'month', 'year']

function rm(n: number): string {
  return 'RM' + Math.round(n).toLocaleString('en-MY')
}

/**
 * Deterministic (non-LLM) revenue-threshold check. The user enters their average
 * sales for a period; we annualise it and compare to the RM1,000,000 threshold,
 * then break the number down. Pure arithmetic — no network, no model.
 */
export function RevenueThresholdCalculator() {
  const t = useT()
  const [period, setPeriod] = useState<Period>('month')
  const [raw, setRaw] = useState('')

  const amount = parseFloat(raw.replace(/[^0-9.]/g, '')) || 0
  const annual = amount * MULTIPLIER[period]
  const hasInput = amount > 0
  const required = annual > THRESHOLD
  const diff = Math.abs(annual - THRESHOLD)

  return (
    <div className="my-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="mb-1 text-lg font-semibold text-teal-900">{t('calc.title')}</h3>
      <p className="mb-4 text-sm text-gray-500">{t('calc.subtitle')}</p>

      {/* Period toggle */}
      <div className="mb-3 flex flex-wrap gap-1 rounded-lg bg-gray-100 p-1">
        {PERIODS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPeriod(p)}
            className={`min-h-[40px] flex-1 rounded-md px-3 text-sm font-medium transition-colors ${
              period === p ? 'bg-white text-teal-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t(`calc.period.${p}`)}
          </button>
        ))}
      </div>

      {/* Amount input */}
      <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="calc-amount">
        {t('calc.inputLabel', { period: t(`calc.periodNoun.${period}`) })}
      </label>
      <div className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 focus-within:border-teal-700 focus-within:ring-2 focus-within:ring-teal-500/40">
        <span className="text-gray-500">RM</span>
        <input
          id="calc-amount"
          inputMode="decimal"
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          placeholder={t('calc.placeholder')}
          className="min-h-[48px] w-full bg-transparent py-2 text-base tabular-nums outline-none"
        />
      </div>
      <p className="mt-1.5 text-xs leading-relaxed text-amber-700">{t('calc.revenueHint')}</p>

      {/* Result */}
      {hasInput && (
        <div className="mt-4 space-y-4">
          <div
            className={`rounded-xl border-l-4 p-4 ${
              required ? 'border-l-amber-500 bg-amber-50' : 'border-l-green-500 bg-green-50'
            }`}
          >
            <p className="text-xs uppercase tracking-wide text-gray-500">{t('calc.estimatedAnnual')}</p>
            <p className="text-2xl font-bold tabular-nums text-gray-900">{rm(annual)}</p>
            <p className={`mt-1 text-sm font-semibold ${required ? 'text-amber-800' : 'text-green-800'}`}>
              {required ? t('calc.resultRequired') : t('calc.resultExempt')}
            </p>
            <p className="mt-1 text-sm text-gray-700">
              {required
                ? t('calc.requiredDetail', { amount: rm(diff) })
                : t('calc.exemptDetail', { amount: rm(diff) })}
            </p>
          </div>

          {/* Breakdown */}
          <div>
            <p className="mb-2 text-sm font-medium text-gray-700">{t('calc.breakdownTitle')}</p>
            <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {PERIODS.map((p) => (
                <div key={p} className="rounded-lg bg-gray-50 p-3 text-center">
                  <dt className="text-xs text-gray-500">{t(`calc.per.${p}`)}</dt>
                  <dd className="text-sm font-semibold tabular-nums text-gray-900">
                    {rm(annual / MULTIPLIER[p])}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <p className="text-xs leading-relaxed text-gray-400">{t('calc.disclaimer')}</p>
        </div>
      )}
    </div>
  )
}
