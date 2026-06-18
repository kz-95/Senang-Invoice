import { create } from 'zustand'
import type { SellerProfile } from '@/lib/types'

interface ProfileStoreState {
  profile: SellerProfile | null
  setProfile: (profile: SellerProfile) => void
  clearProfile: () => void
}

export const useProfileStore = create<ProfileStoreState>((set) => ({
  profile: null,
  setProfile: (profile) => set({ profile }),
  clearProfile: () => set({ profile: null }),
}))
