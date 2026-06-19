'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { OnboardingCarousel } from './OnboardingCarousel'
import { track } from '@/lib/analytics'
import { ONBOARDING_ALWAYS_SHOW, ONBOARDING_FLAG } from '@/lib/constants'

/**
 * Decides what a visitor to '/' sees:
 *  - Desktop (>=1024px): marketing page (renders underneath, gate returns null).
 *  - Mobile, not yet onboarded (or ALWAYS_SHOW): the onboarding carousel overlay.
 *  - Mobile, already onboarded: redirect into the app.
 */
export function LandingGate() {
  const router = useRouter()
  const [showCarousel, setShowCarousel] = useState(false)

  useEffect(() => {
    track('landing_view')
    const isMobile = window.matchMedia('(max-width: 1023px)').matches
    if (!isMobile) return

    let done = false
    if (!ONBOARDING_ALWAYS_SHOW) {
      try { done = localStorage.getItem(ONBOARDING_FLAG) === '1' } catch { /* ignore */ }
    }
    if (done) {
      router.replace('/dashboard')
    } else {
      setShowCarousel(true)
    }
  }, [router])

  if (!showCarousel) return null
  return <OnboardingCarousel />
}
