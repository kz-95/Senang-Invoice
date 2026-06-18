import type { NumberPreset } from '@/lib/types'
import { db } from './db'

const SETTINGS_KEY = 'seller'

export async function getAllPresets(): Promise<NumberPreset[]> {
  const row = await db.settings.get(SETTINGS_KEY)
  return row?.value?.numberingPresets ?? []
}

export async function getDefaultPreset(): Promise<NumberPreset | null> {
  const presets = await getAllPresets()
  return presets.find((p) => p.isDefault) ?? presets[0] ?? null
}

export async function addPreset(preset: NumberPreset): Promise<void> {
  const row = await db.settings.get(SETTINGS_KEY)
  if (!row?.value) throw new Error('Profile not found')
  const profile = row.value
  const presets = profile.numberingPresets ?? []
  presets.push(preset)
  profile.numberingPresets = presets
  await db.settings.put({ key: SETTINGS_KEY, value: profile })
}

export async function updatePreset(presetId: string, updates: Partial<NumberPreset>): Promise<void> {
  const row = await db.settings.get(SETTINGS_KEY)
  if (!row?.value) throw new Error('Profile not found')
  const profile = row.value
  const presets = profile.numberingPresets ?? []
  const idx = presets.findIndex((p: NumberPreset) => p.id === presetId)
  if (idx === -1) throw new Error(`Preset ${presetId} not found`)
  presets[idx] = { ...presets[idx], ...updates }
  profile.numberingPresets = presets
  await db.settings.put({ key: SETTINGS_KEY, value: profile })
}

export async function deletePreset(presetId: string): Promise<void> {
  const row = await db.settings.get(SETTINGS_KEY)
  if (!row?.value) throw new Error('Profile not found')
  const profile = row.value
  profile.numberingPresets = (profile.numberingPresets ?? []).filter((p: NumberPreset) => p.id !== presetId)
  await db.settings.put({ key: SETTINGS_KEY, value: profile })
}

export async function setDefaultPreset(presetId: string): Promise<void> {
  const row = await db.settings.get(SETTINGS_KEY)
  if (!row?.value) throw new Error('Profile not found')
  const profile = row.value
  profile.numberingPresets = (profile.numberingPresets ?? []).map((p: NumberPreset) => ({
    ...p,
    isDefault: p.id === presetId,
  }))
  await db.settings.put({ key: SETTINGS_KEY, value: profile })
}

export async function advanceSequence(presetId: string): Promise<NumberPreset> {
  const row = await db.settings.get(SETTINGS_KEY)
  if (!row?.value) throw new Error('Profile not found')
  const profile = row.value
  const presets = profile.numberingPresets ?? []
  const idx = presets.findIndex((p: NumberPreset) => p.id === presetId)
  if (idx === -1) throw new Error(`Preset ${presetId} not found`)
  const updated = { ...presets[idx], nextSeq: presets[idx].nextSeq + 1 }
  presets[idx] = updated
  profile.numberingPresets = presets
  await db.settings.put({ key: SETTINGS_KEY, value: profile })
  return updated
}
