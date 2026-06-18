'use client'
import Link from 'next/link'
import { useT } from '@/hooks/useT'

const articles = [
  {
    slug: 'do-i-need-einvoice',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    title: 'Do I need e-invoicing?',
    summary: 'Check scope, thresholds, and who must comply.',
  },
  {
    slug: 'register-mytax',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
      </svg>
    ),
    title: 'Register on MyTax',
    summary: 'Digital certificate, TIN, and role setup.',
  },
  {
    slug: 'get-myinvois-access',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
      </svg>
    ),
    title: 'Get MyInvois Access',
    summary: 'Portal setup, ERP registration, and API keys.',
  },
  {
    slug: 'your-first-invoice',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
    title: 'Your First Invoice',
    summary: 'Create and submit e-invoices in SenangInvoice.',
  },
]

export function GuideTeaser() {
  const t = useT()
  return (
    <section className="py-16 px-4 max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold text-center text-teal-900 mb-10">
        {t('landing.guideTitle')}
      </h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {articles.map((a) => (
          <Link
            key={a.slug}
            href={`/guide/${a.slug}`}
            className="group block bg-white border border-gray-200 rounded-xl p-5 hover:border-teal-300 hover:shadow-md transition-all"
          >
            <div className="text-teal-600 mb-3 group-hover:text-teal-700 transition-colors">
              {a.icon}
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">{a.title}</h3>
            <p className="text-xs text-gray-500 leading-relaxed">{a.summary}</p>
          </Link>
        ))}
      </div>
    </section>
  )
}
