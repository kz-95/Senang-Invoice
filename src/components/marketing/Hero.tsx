'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { profileRepository } from '@/services/data/profileRepository'
import { useT } from '@/hooks/useT'

export function Hero() {
  const [isOnboarded, setIsOnboarded] = useState(false)
  const [checked, setChecked] = useState(false)
  const t = useT()

  useEffect(() => {
    profileRepository.get().then((profile) => {
      setIsOnboarded(!!profile)
      setChecked(true)
    })
  }, [])

  return (
    <section className="py-20 px-4 text-center bg-white">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-bold text-teal-900 mb-4 leading-tight">
          {t('landing.heroTitle')}
        </h1>
        <p className="text-lg text-gray-600 mb-8 max-w-xl mx-auto">
          {t('landing.heroSubtitle')}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/guide/do-i-need-einvoice"
            className="inline-flex items-center justify-center px-8 py-3 bg-teal-700 text-white font-semibold rounded-lg hover:bg-teal-800 transition-colors shadow-md"
          >
            {t('landing.heroCtaScope')}
          </Link>
          <Link
            href="/create"
            className="inline-flex items-center justify-center px-8 py-3 bg-white text-teal-700 font-semibold rounded-lg border-2 border-teal-700 hover:bg-teal-50 transition-colors"
          >
            {t('landing.heroCtaCreate')}
          </Link>
        </div>
        {checked && isOnboarded && (
          <p className="mt-6">
            <Link
              href="/dashboard"
              className="text-sm text-teal-600 hover:text-teal-800 underline underline-offset-4"
            >
              {t('landing.goToDashboard')}
            </Link>
          </p>
        )}
      </div>
    </section>
  )
}
