'use client'

import { useState, useEffect } from 'react'
import type { NumberPreset } from '@/lib/types'
import { getAllPresets, setDefaultPreset, deletePreset } from '@/services/data/numberingPresetRepository'
import { Button } from '@/components/common/Button'

interface Props {
  onEdit: (preset: NumberPreset) => void
  onAdd: () => void
}

export function PresetManager({ onEdit, onAdd }: Props) {
  const [presets, setPresets] = useState<NumberPreset[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAllPresets().then((p) => { setPresets(p); setLoading(false) })
  }, [])

  const refresh = async () => {
    const p = await getAllPresets()
    setPresets(p)
  }

  const handleSetDefault = async (id: string) => {
    await setDefaultPreset(id)
    await refresh()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this preset?')) return
    await deletePreset(id)
    await refresh()
  }

  if (loading) {
    return <div className="text-sm text-gray-500 py-4">Loading presets...</div>
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">Numbering Presets</h3>
        <Button variant="ghost" size="sm" onClick={onAdd} aria-label="Add new preset">
          + New Preset
        </Button>
      </div>
      {presets.length === 0 ? (
        <p className="text-sm text-gray-500 py-2">No presets yet. Add one to customize invoice numbers.</p>
      ) : (
        <ul className="divide-y divide-gray-100 border rounded-lg">
          {presets.map((p) => (
            <li key={p.id} className="flex items-center justify-between px-3 py-2.5 hover:bg-gray-50">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium text-gray-800 truncate">{p.name}</span>
                  {p.isDefault && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-100 text-teal-700 font-medium">Default</span>
                  )}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  <code className="bg-gray-100 px-1 rounded">{p.pattern}</code>
                  {' '}· Next: {p.nextSeq}
                </div>
              </div>
              <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                {!p.isDefault && (
                  <button
                    onClick={() => handleSetDefault(p.id)}
                    className="text-xs text-teal-600 hover:text-teal-800 px-2 py-1 rounded hover:bg-teal-50"
                    aria-label={`Set ${p.name} as default`}
                  >
                    Set Default
                  </button>
                )}
                <button
                  onClick={() => onEdit(p)}
                  className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100"
                  aria-label={`Edit ${p.name}`}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(p.id)}
                  className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50"
                  aria-label={`Delete ${p.name}`}
                >
                  Del
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
