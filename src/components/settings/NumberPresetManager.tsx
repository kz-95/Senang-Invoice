'use client'
import { useState, useMemo } from 'react'
import { useProfileStore } from '@/stores/profileStore'
import { profileRepository } from '@/services/data/profileRepository'
import { formatInvoiceNumber, validatePattern, getCustomTokensFromPattern, cloneDefaultPresets } from '@/lib/numbering'
import { Button } from '@/components/common/Button'
import { Input } from '@/components/common/Input'
import type { NumberPreset } from '@/lib/types'

export function NumberPresetManager() {
  const profile = useProfileStore(s => s.profile)
  const setProfile = useProfileStore(s => s.setProfile)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [addingNew, setAddingNew] = useState(false)

  const presets = profile?.numberingPresets ?? []

  const refresh = async () => {
    const p = await profileRepository.get()
    if (p) setProfile(p)
  }

  if (!profile) return null

  return (
    <section className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">Numbering Presets</h3>
          <p className="text-sm text-gray-500">Manage invoice number patterns and counters</p>
        </div>
        <Button size="sm" variant="outline" onClick={() => { setEditingId(null); setAddingNew(true) }}>
          + Add Preset
        </Button>
      </div>

      {presets.map(preset => (
        <div key={preset.id}>
          {editingId === preset.id ? (
            <PresetEditor
              preset={preset}
              onSave={async (updates) => {
                await profileRepository.updatePreset(profile, preset.id, updates)
                setEditingId(null)
                await refresh()
              }}
              onCancel={() => setEditingId(null)}
            />
          ) : (
            <div className="flex items-center justify-between py-2 border-t border-gray-100">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">{preset.name}</span>
                  {preset.isDefault && <span className="text-xs text-teal-600 font-medium">{'\u2605'}</span>}
                </div>
                <p className="text-xs text-gray-500 font-mono">{preset.pattern}</p>
                <p className="text-xs text-gray-400">
                  Next: {String(preset.nextSeq).padStart(4, '0')}
                  {preset.reset !== 'never' && ` (reset: ${preset.reset})`}
                  {Object.keys(preset.customTokens).length > 0 && ` \u2022 Tokens: ${Object.keys(preset.customTokens).join(', ')}`}
                </p>
              </div>
              <div className="flex gap-1 shrink-0">
                {!preset.isDefault && (
                  <Button size="sm" variant="ghost" onClick={async () => {
                    await profileRepository.setDefaultPreset(profile, preset.id)
                    await refresh()
                  }}>
                    Set Default
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => { setAddingNew(false); setEditingId(preset.id) }}>
                  Edit
                </Button>
                {presets.length > 1 && (
                  <Button size="sm" variant="ghost" onClick={async () => {
                    await profileRepository.deletePreset(profile, preset.id)
                    await refresh()
                  }}>
                    Del
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      ))}

      {addingNew && !editingId && (
        <PresetEditor
          preset={{
            id: crypto.randomUUID(),
            name: '',
            pattern: 'INV-{seq:0000}',
            customTokens: {},
            reset: 'never',
            nextSeq: 1,
          }}
          onSave={async (updates) => {
            await profileRepository.addPreset(profile, {
              ...updates,
              id: crypto.randomUUID(),
              nextSeq: 1,
            } as NumberPreset)
            setAddingNew(false)
            await refresh()
          }}
          onCancel={() => setAddingNew(false)}
        />
      )}
    </section>
  )
}

function PresetEditor({
  preset,
  onSave,
  onCancel,
}: {
  preset: NumberPreset
  onSave: (updates: Partial<NumberPreset>) => Promise<void>
  onCancel: () => void
}) {
  const [name, setName] = useState(preset.name)
  const [pattern, setPattern] = useState(preset.pattern)
  const [reset, setReset] = useState<'never' | 'yearly' | 'monthly'>(preset.reset)
  const [isDefault, setIsDefault] = useState(preset.isDefault ?? false)
  const [tokens, setTokens] = useState<Record<string, { label: string; default: string }>>(
    Object.fromEntries(
      Object.entries(preset.customTokens).map(([k, v]) => [k, { label: v.label, default: v.default ?? '' }])
    )
  )
  const [newTokenName, setNewTokenName] = useState('')
  const [error, setError] = useState<string | null>(null)

  const validationError = useMemo(() => validatePattern(pattern, tokens), [pattern, tokens])

  const preview = useMemo(() => {
    const tokenValues: Record<string, string> = {}
    for (const [k, v] of Object.entries(tokens)) {
      tokenValues[k] = v.default || k.toUpperCase()
    }
    try {
      return formatInvoiceNumber({ ...preset, pattern, customTokens: tokens, reset }, tokenValues).number
    } catch {
      return 'Invalid pattern'
    }
  }, [pattern, tokens, reset, preset])

  const addToken = () => {
    const name = newTokenName.trim()
    if (!name) return
    if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(name)) {
      setError('Token name must start with a letter and contain only letters, numbers, hyphens, or underscores.')
      return
    }
    if (tokens[name]) {
      setError('Token already exists.')
      return
    }
    setTokens(prev => ({ ...prev, [name]: { label: name.charAt(0).toUpperCase() + name.slice(1), default: '' } }))
    setNewTokenName('')
    setError(null)
  }

  const removeToken = (key: string) => {
    setTokens(prev => {
      const next = { ...prev }
      delete next[key]
      return next
    })
    setPattern(prev => prev.replace(new RegExp(`\\{${key}\\}`, 'g'), ''))
  }

  const insertToken = (token: string) => {
    setPattern(prev => prev + token)
  }

  const handleSave = async () => {
    if (!name.trim()) { setError('Preset name is required.'); return }
    if (validationError) { setError(validationError); return }
    setError(null)
    await onSave({
      name: name.trim(),
      pattern,
      customTokens: tokens,
      reset,
      isDefault,
    })
  }

  return (
    <div className="space-y-3 border border-teal-200 rounded-lg p-3 bg-teal-50/30">
      <Input label="Preset Name" value={name} onChange={e => setName(e.target.value)} placeholder="My Preset" />
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1">Pattern</label>
        <div className="flex gap-1 mb-2 flex-wrap">
          <button type="button" onClick={() => insertToken('{seq:0000}')} className="px-2 py-0.5 text-xs bg-gray-200 rounded hover:bg-gray-300">{'{seq:0000}'}</button>
          <button type="button" onClick={() => insertToken('{YYYY}')} className="px-2 py-0.5 text-xs bg-gray-200 rounded hover:bg-gray-300">{'{YYYY}'}</button>
          <button type="button" onClick={() => insertToken('{MM}')} className="px-2 py-0.5 text-xs bg-gray-200 rounded hover:bg-gray-300">{'{MM}'}</button>
          <button type="button" onClick={() => insertToken('{DD}')} className="px-2 py-0.5 text-xs bg-gray-200 rounded hover:bg-gray-300">{'{DD}'}</button>
          {Object.keys(tokens).map(k => (
            <button key={k} type="button" onClick={() => insertToken(`{${k}}`)} className="px-2 py-0.5 text-xs bg-teal-100 rounded hover:bg-teal-200">{`{${k}}`}</button>
          ))}
        </div>
        <Input value={pattern} onChange={e => setPattern(e.target.value)} placeholder="INV-{seq:0000}" />
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1">Custom Tokens</label>
        {Object.entries(tokens).map(([key, val]) => (
          <div key={key} className="flex gap-2 items-end mb-2">
            <div className="flex-1">
              <label className="text-xs text-gray-500">{`{${key}}`} Label</label>
              <Input
                value={val.label}
                onChange={e => setTokens(prev => ({ ...prev, [key]: { ...prev[key], label: e.target.value } }))}
                placeholder="Display label"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-gray-500">Default Value</label>
              <Input
                value={val.default}
                onChange={e => setTokens(prev => ({ ...prev, [key]: { ...prev[key], default: e.target.value } }))}
                placeholder="Optional"
              />
            </div>
            <button type="button" onClick={() => removeToken(key)} className="text-red-500 text-sm pb-2">×</button>
          </div>
        ))}
        <div className="flex gap-2">
          <Input
            value={newTokenName}
            onChange={e => { setNewTokenName(e.target.value); setError(null) }}
            placeholder="New token name (e.g. dept)"
            className="flex-1"
          />
          <Button size="sm" variant="outline" onClick={addToken}>Add</Button>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1">Reset Counter</label>
        <select
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-teal-700"
          value={reset}
          onChange={e => setReset(e.target.value as 'never' | 'yearly' | 'monthly')}
        >
          <option value="never">Never</option>
          <option value="yearly">Yearly</option>
          <option value="monthly">Monthly</option>
        </select>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={isDefault} onChange={e => setIsDefault(e.target.checked)} className="rounded border-gray-300 text-teal-600" />
        Set as default
      </label>

      <p className="text-xs text-gray-500">
        Live preview: <span className="font-mono text-teal-700">{preview}</span>
      </p>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {validationError && <p className="text-sm text-amber-600">{validationError}</p>}

      <div className="flex gap-2">
        <Button size="sm" variant="primary" onClick={handleSave}>Save</Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  )
}
