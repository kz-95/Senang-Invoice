'use client'

import { useState } from 'react'
import type { NumberPreset } from '@/lib/types'
import { addPreset, updatePreset } from '@/services/data/numberingPresetRepository'

interface Props {
  preset: NumberPreset | null
  onClose: () => void
  onSaved: () => void
}

export function PresetEditModal({ preset, onClose, onSaved }: Props) {
  const isNew = !preset
  const [name, setName] = useState(preset?.name ?? '')
  const [pattern, setPattern] = useState(preset?.pattern ?? '{prefix}-{seq:0000}')
  const [reset, setReset] = useState<'never' | 'yearly' | 'monthly'>(preset?.reset ?? 'never')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    if (!name.trim()) { setError('Name is required'); return }
    if (!pattern.includes('{seq')) { setError('Pattern must include {seq} or {seq:0000}'); return }
    setSaving(true)
    setError('')
    try {
      const data: NumberPreset = {
        id: preset?.id ?? `preset-${Date.now()}`,
        name: name.trim(),
        pattern: pattern.trim(),
        customTokens: preset?.customTokens ?? {},
        reset,
        nextSeq: preset?.nextSeq ?? 1,
        isDefault: preset?.isDefault ?? false,
        lastResetPeriod: preset?.lastResetPeriod,
      }
      if (isNew) {
        await addPreset(data)
      } else {
        await updatePreset(preset!.id, data)
      }
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-5 space-y-4"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={isNew ? 'Create numbering preset' : `Edit ${preset?.name}`}
      >
        <h3 className="text-lg font-semibold text-gray-800">
          {isNew ? 'New Preset' : 'Edit Preset'}
        </h3>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="Standard Invoice"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pattern</label>
            <input
              type="text"
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="{prefix}-{seq:0000}"
            />
            <p className="text-xs text-gray-500 mt-1">
              Tokens: {'{prefix}'} {'{seq}'} {'{seq:0000}'} {'{YYYY}'} {'{MM}'} {'{DD}'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reset Sequence</label>
            <select
              value={reset}
              onChange={(e) => setReset(e.target.value as 'never' | 'yearly' | 'monthly')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="never">Never</option>
              <option value="yearly">Yearly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Preview</label>
            <code className="block bg-gray-100 rounded-lg px-3 py-2 text-sm text-gray-700">
              {pattern
                .replace('{prefix}', 'INV')
                .replace(/\{seq:\d+\}/, '0001')
                .replace(/\{seq\}/g, '0001')
                .replace(/\{YYYY}/g, '2026')
                .replace(/\{MM}/g, '06')
                .replace(/\{DD}/g, '19')}
            </code>
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2" role="alert">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm text-white bg-teal-600 hover:bg-teal-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
