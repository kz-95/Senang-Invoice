'use client'
import { useT } from '@/hooks/useT'

export function PainVsEase() {
  const t = useT()

  const portalItems = [
    t('landing.portalItem1'),
    t('landing.portalItem2'),
    t('landing.portalItem3'),
    t('landing.portalItem4'),
  ]

  const senangItems = [
    t('landing.senangItem1'),
    t('landing.senangItem2'),
    t('landing.senangItem3'),
    t('landing.senangItem4'),
  ]

  return (
    <section className="py-16 px-4 max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold text-center text-teal-900 mb-10">
        {t('landing.painTitle')}
      </h2>
      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-500 mb-4">
            {t('landing.portalTitle')}
          </h3>
          <ul className="space-y-3">
            {portalItems.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-gray-500">
                <svg className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-teal-50 border border-teal-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-teal-700 mb-4">
            {t('landing.senangTitle')}
          </h3>
          <ul className="space-y-3">
            {senangItems.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-teal-800">
                <svg className="w-5 h-5 text-teal-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
