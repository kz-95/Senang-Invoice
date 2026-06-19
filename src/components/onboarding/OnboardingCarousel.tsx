'use client'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/common/Button'
import { LangToggle } from '@/components/common/LangToggle'
import { useT } from '@/hooks/useT'
import { track } from '@/lib/analytics'
import { getAccessToken } from '@/services/drive/driveAuth'
import { ONBOARDING_ALWAYS_SHOW, ONBOARDING_FLAG } from '@/lib/constants'

const BoltIcon = (
  <svg className="h-10 w-10" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
  </svg>
)
const ShieldIcon = (
  <svg className="h-10 w-10" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
  </svg>
)
const CloudIcon = (
  <svg className="h-10 w-10" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z" />
  </svg>
)

interface Slide {
  key: string
  icon: ReactNode
  titleKey: string
  descKey: string
  bullets?: string[]
}

export function OnboardingCarousel() {
  const router = useRouter()
  const t = useT()
  const [index, setIndex] = useState(0)
  const [connecting, setConnecting] = useState(false)
  const startX = useRef<number | null>(null)

  const slides: Slide[] = [
    {
      key: 'welcome',
      icon: BoltIcon,
      titleKey: 'onboarding.welcomeTitle',
      descKey: 'onboarding.welcomeDesc',
      bullets: ['onboarding.welcomeStep1', 'onboarding.welcomeStep2', 'onboarding.welcomeStep3'],
    },
    {
      key: 'scope',
      icon: ShieldIcon,
      titleKey: 'onboarding.scopeTitle',
      descKey: 'onboarding.scopeDesc',
    },
    {
      key: 'drive',
      icon: CloudIcon,
      titleKey: 'onboarding.driveTitle',
      descKey: 'onboarding.driveDesc',
    },
  ]

  const last = slides.length - 1
  const isLast = index === last

  useEffect(() => { track('onboarding_start') }, [])
  useEffect(() => {
    track('onboarding_slide_view', { index, slide: slides[index].key })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index])

  const finish = (via: 'complete' | 'skip') => {
    if (!ONBOARDING_ALWAYS_SHOW) {
      try { localStorage.setItem(ONBOARDING_FLAG, '1') } catch { /* ignore */ }
    }
    track(via === 'skip' ? 'onboarding_skip' : 'onboarding_complete', { atSlide: slides[index].key })
    track('profile_start')
    router.push('/profile')
  }

  const next = () => setIndex(i => Math.min(last, i + 1))
  const back = () => setIndex(i => Math.max(0, i - 1))

  const onConnectDrive = async () => {
    track('drive_connect_click')
    setConnecting(true)
    try {
      await getAccessToken()
    } catch {
      // OAuth may be unavailable (testing mode) — proceed regardless.
    } finally {
      setConnecting(false)
      finish('complete')
    }
  }

  const onTouchStart = (e: React.TouchEvent) => { startX.current = e.touches[0].clientX }
  const onTouchEnd = (e: React.TouchEvent) => {
    if (startX.current === null) return
    const dx = e.changedTouches[0].clientX - startX.current
    if (Math.abs(dx) > 50) {
      if (dx < 0) next()
      else back()
    }
    startX.current = null
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      {/* Top bar: dots + skip */}
      <div
        className="flex items-center justify-between px-5 pt-4"
        style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}
      >
        <div className="flex items-center gap-2" role="tablist" aria-label="Onboarding progress">
          {slides.map((s, i) => (
            <button
              key={s.key}
              role="tab"
              aria-selected={i === index}
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => setIndex(i)}
              className={`h-2 rounded-full transition-all duration-300 motion-reduce:transition-none ${
                i === index ? 'w-6 bg-teal-600' : 'w-2 bg-gray-300'
              }`}
            />
          ))}
        </div>
        {!isLast && (
          <button
            onClick={() => finish('skip')}
            className="min-h-[44px] px-2 text-sm font-medium text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500 rounded-lg"
          >
            {t('onboarding.skip')}
          </button>
        )}
        {isLast && <LangToggle className="text-gray-600 hover:bg-gray-100" />}
      </div>

      {/* Slides */}
      <div
        className="relative flex-1 overflow-hidden"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div
          className="flex h-full transition-transform duration-300 ease-out motion-reduce:transition-none"
          style={{ width: `${slides.length * 100}%`, transform: `translateX(-${index * (100 / slides.length)}%)` }}
        >
          {slides.map(slide => (
            <section
              key={slide.key}
              className="flex h-full flex-col items-center justify-center px-8 text-center"
              style={{ width: `${100 / slides.length}%` }}
            >
              <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
                {slide.icon}
              </div>
              <h1 className="mb-3 text-3xl font-bold tracking-tight text-teal-900">
                {t(slide.titleKey)}
              </h1>
              <p className="mx-auto max-w-xs text-base leading-relaxed text-gray-600">
                {t(slide.descKey)}
              </p>

              {slide.bullets && (
                <ul className="mx-auto mt-6 space-y-2 text-left">
                  {slide.bullets.map(b => (
                    <li key={b} className="flex items-center gap-3 text-sm text-gray-700">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-100 text-teal-700">
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                      </span>
                      {t(b)}
                    </li>
                  ))}
                </ul>
              )}

              {slide.key === 'scope' && (
                <Link
                  href="/guide/do-i-need-einvoice"
                  className="mt-6 text-sm font-medium text-teal-700 underline underline-offset-4 hover:text-teal-800"
                >
                  {t('onboarding.scopeLink')}
                </Link>
              )}
            </section>
          ))}
        </div>
      </div>

      {/* Bottom controls */}
      <div
        className="px-6 pb-6"
        style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
      >
        {!isLast ? (
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={back}
              disabled={index === 0}
              className="min-h-[48px] px-4 text-sm font-medium text-gray-500 disabled:invisible hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500 rounded-lg"
            >
              {t('onboarding.back')}
            </button>
            <Button size="lg" onClick={next} className="flex-1 max-w-[200px]">
              {t('onboarding.next')}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <Button size="lg" onClick={onConnectDrive} loading={connecting} className="w-full">
              {t('onboarding.driveConnect')}
            </Button>
            <Button size="lg" variant="ghost" onClick={() => { track('drive_skip'); finish('complete') }} disabled={connecting} className="w-full">
              {t('onboarding.driveSkip')}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
