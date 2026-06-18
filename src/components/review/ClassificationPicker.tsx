'use client'
import { Select } from '@/components/common/Select'
import { getAllClassifications } from '@/services/compliance/classificationCatalog'

interface ClassificationPickerProps {
  value: string
  onChange: (code: string) => void
}

export function ClassificationPicker({ value, onChange }: ClassificationPickerProps) {
  const options = getAllClassifications().map(c => ({
    value: c.code,
    label: `${c.code} - ${c.description}`,
  }))

  return (
    <Select
      label="Classification"
      options={[{ value: '', label: 'Select...' }, ...options]}
      value={value}
      onChange={e => onChange(e.target.value)}
    />
  )
}
