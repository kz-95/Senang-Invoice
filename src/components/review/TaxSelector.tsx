'use client'
import { Select } from '@/components/common/Select'

interface TaxSelectorProps {
  value: string
  onChange: (type: string) => void
}

const taxOptions = [
  { value: '06', label: '06 — Exempt' },
  { value: '01', label: '01 — Sales Tax' },
  { value: '02', label: '02 — Service Tax' },
  { value: 'E', label: 'E — Zero-Rated' },
]

export function TaxSelector({ value, onChange }: TaxSelectorProps) {
  return (
    <Select
      label="Tax Type"
      options={taxOptions}
      value={value}
      onChange={e => onChange(e.target.value)}
    />
  )
}
