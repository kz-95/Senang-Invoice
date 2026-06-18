'use client'
import { useT } from '@/hooks/useT'

export function TrustRow() {
  const t = useT()

  const cards = [
    {
      icon: (
        <svg className="w-8 h-8 text-teal-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
        </svg>
      ),
      title: t('landing.feature1Title'),
      desc: t('landing.feature1Desc'),
    },
    {
      icon: (
        <svg className="w-8 h-8 text-teal-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: t('landing.feature2Title'),
      desc: t('landing.feature2Desc'),
    },
    {
      icon: (
        <svg className="w-8 h-8 text-teal-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: t('landing.feature3Title'),
      desc: t('landing.feature3Desc'),
    },
  ]

  return (
    <section className="py-16 px-4 bg-white">
      <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-6">
        {cards.map((card, i) => (
          <div key={i} className="text-center p-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-teal-50 mb-4">
              {card.icon}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{card.title}</h3>
            <p className="text-gray-600 text-sm leading-relaxed">{card.desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
