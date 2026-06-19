'use client'
import { Select } from '@/components/common/Select'
import { getAllUoms } from '@/services/compliance/uomCatalog'

interface UomPickerProps {
  value: string
  onChange: (code: string) => void
}

export function UomPicker({ value, onChange }: UomPickerProps) {
  const options = getAllUoms().map(u => ({
    value: u.code,
    label: `${u.code} - ${u.description}`,
  }))

  return (
    <Select
      label="Unit"
      options={[{ value: '', label: 'Select...' }, ...options]}
      value={value}
      onChange={e => onChange(e.target.value)}
    />
  )
}
