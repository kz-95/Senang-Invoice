'use client'
import Link from 'next/link'
import { useT } from '@/hooks/useT'

export function CtaFooter() {
  const t = useT()

  return (
    <section className="py-20 px-4 text-center bg-teal-700">
      <h2 className="text-2xl font-bold text-white mb-4">{t('landing.readyTitle')}</h2>
      <p className="text-teal-100 mb-8 max-w-md mx-auto">
        {t('landing.readySubtitle')}
      </p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <span
          aria-disabled="true"
          className="inline-flex cursor-not-allowed items-center justify-center px-8 py-3 bg-teal-600 text-teal-200 font-semibold rounded-2xl"
        >
          {t('landing.downloadNow')}
        </span>
        <Link
          href="/support"
          className="inline-flex items-center text-teal-100 hover:text-white transition-colors text-sm underline underline-offset-4"
        >
          {t('landing.fullGuideCta')}
        </Link>
      </div>
    </section>
  )
}
