import { db } from './db'
import type { SellerProfile } from '@/lib/types'
import { cloneDefaultPresets } from '@/lib/numbering'

const PROFILE_KEY = 'seller'

export const profileRepository = {
  async get(): Promise<SellerProfile | undefined> {
    const row = await db.settings.get(PROFILE_KEY)
    return row?.value as SellerProfile | undefined
  },
  async save(profile: SellerProfile): Promise<void> {
    await db.settings.put({ key: PROFILE_KEY, value: profile })
  },
  async clear(): Promise<void> {
    await db.settings.delete(PROFILE_KEY)
  },

  async ensurePresets(profile: SellerProfile): Promise<SellerProfile> {
    if (!profile.numberingPresets || profile.numberingPresets.length === 0) {
      profile.numberingPresets = cloneDefaultPresets()
      await db.settings.put({ key: PROFILE_KEY, value: profile })
    }
    return profile
  },

  async updatePreset(profile: SellerProfile, presetId: string, updates: Partial<import('@/lib/types').NumberPreset>): Promise<SellerProfile> {
    const idx = profile.numberingPresets.findIndex(p => p.id === presetId)
    if (idx === -1) return profile
    profile.numberingPresets[idx] = { ...profile.numberingPresets[idx], ...updates }
    await db.settings.put({ key: PROFILE_KEY, value: profile })
    return profile
  },

  async deletePreset(profile: SellerProfile, presetId: string): Promise<SellerProfile> {
    if (profile.numberingPresets.length <= 1) return profile
    const wasDefault = profile.numberingPresets.find(p => p.id === presetId)?.isDefault
    profile.numberingPresets = profile.numberingPresets.filter(p => p.id !== presetId)
    if (wasDefault && profile.numberingPresets.length > 0) {
      profile.numberingPresets[0].isDefault = true
    }
    await db.settings.put({ key: PROFILE_KEY, value: profile })
    return profile
  },

  async setDefaultPreset(profile: SellerProfile, presetId: string): Promise<SellerProfile> {
    profile.numberingPresets = profile.numberingPresets.map(p => ({
      ...p,
      isDefault: p.id === presetId,
    }))
    await db.settings.put({ key: PROFILE_KEY, value: profile })
    return profile
  },

  async addPreset(profile: SellerProfile, preset: import('@/lib/types').NumberPreset): Promise<SellerProfile> {
    profile.numberingPresets.push(preset)
    await db.settings.put({ key: PROFILE_KEY, value: profile })
    return profile
  },
}
