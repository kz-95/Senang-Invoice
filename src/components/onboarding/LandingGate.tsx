'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { track } from '@/lib/analytics'
import { ONBOARDING_ALWAYS_SHOW, ONBOARDING_FLAG } from '@/lib/constants'

/**
 * Decides what a visitor to '/' sees:
 *  - Desktop (>=1024px): marketing page (renders underneath, gate returns null).
 *  - Mobile, not yet onboarded (or ALWAYS_SHOW): redirect into the /welcome flow.
 *  - Mobile, already onboarded: redirect into the app.
 */
export function LandingGate() {
  const router = useRouter()

  useEffect(() => {
    track('landing_view')
    const isMobile = window.matchMedia('(max-width: 1023px)').matches
    if (!isMobile) return

    let done = false
    if (!ONBOARDING_ALWAYS_SHOW) {
      try { done = localStorage.getItem(ONBOARDING_FLAG) === '1' } catch { /* ignore */ }
    }
    router.replace(done ? '/dashboard' : '/welcome/1')
  }, [router])

  return null
}
