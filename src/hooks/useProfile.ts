'use client'
import { useCallback, useEffect } from 'react'
import { useProfileStore } from '@/stores/profileStore'
import { profileRepository } from '@/services/data/profileRepository'
import type { SellerProfile } from '@/lib/types'

export function useProfile() {
  const profile = useProfileStore((s) => s.profile)
  const setProfile = useProfileStore((s) => s.setProfile)

  useEffect(() => {
    profileRepository.get().then((p) => {
      if (p) setProfile(p)
    })
  }, [setProfile])

  const save = useCallback(async (p: SellerProfile) => {
    await profileRepository.save(p)
    setProfile(p)
  }, [setProfile])

  return { profile, save }
}
