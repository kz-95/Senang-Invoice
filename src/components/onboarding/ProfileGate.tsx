'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useProfileStore } from '@/stores/profileStore'
import { useUiStore } from '@/stores/uiStore'
import { profileRepository } from '@/services/data/profileRepository'
import { safeRandomUUID } from '@/lib/crypto'

interface ProfileGateProps {
  children: React.ReactNode
}

const EXEMPT_ROUTES = ['/profile', '/settings', '/ask']

/**
 * Guards app pages. If the seller profile is missing or incomplete
 * (no businessName + TIN), redirects to /profile with a toast.
 * Exempts /profile, /settings, and /ask from the check.
 */
export function ProfileGate({ children }: ProfileGateProps) {
  const profile = useProfileStore(s => s.profile)
  const setProfile = useProfileStore(s => s.setProfile)
  const addToast = useUiStore(s => s.addToast)
  const router = useRouter()
  const pathname = usePathname()
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    // Skip gate for exempt routes
    if (EXEMPT_ROUTES.some(r => pathname === r || pathname.startsWith(r + '/'))) {
      setChecked(true)
      return
    }

    const toastAndRedirect = () => {
      addToast({ id: safeRandomUUID(), message: 'Please complete your seller profile first.', type: 'info' })
      router.replace('/profile')
    }

    // If profile already in store, check immediately
    if (profile) {
      if (!profile.businessName || !profile.tin) {
        toastAndRedirect()
      }
      setChecked(true)
      return
    }

    // Load from DB
    profileRepository.get().then(p => {
      if (p) setProfile(p)
      if (!p?.businessName || !p?.tin) {
        toastAndRedirect()
      }
      setChecked(true)
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (!checked) return null

  return <>{children}</>
}
