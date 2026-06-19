'use client'
import { useInvoiceStore } from '@/stores/invoiceStore'
import { Input } from '@/components/common/Input'
import { ClassificationPicker } from './ClassificationPicker'
import { UomPicker } from './UomPicker'
import { TaxSelector } from './TaxSelector'
import { useT } from '@/hooks/useT'

interface LineItemEditorProps {
  index: number
}

export function LineItemEditor({ index }: LineItemEditorProps) {
  const line = useInvoiceStore(s => s.lines[index])
  const updateLine = useInvoiceStore(s => s.updateLine)
  const t = useT()

  if (!line) return null

  return (
    <div className="border border-gray-200 rounded-lg p-3 space-y-3 bg-white">
      <Input
        label={t('review.description')}
        value={line.description}
        onChange={e => updateLine(index, { description: e.target.value })}
      />
      <div className="grid grid-cols-2 gap-3">
        <Input
          label={t('review.quantity')}
          type="number"
          inputMode="decimal"
          value={String(line.qty)}
          onChange={e => updateLine(index, { qty: Number(e.target.value) || 1 })}
        />
        <Input
          label={t('review.unitPrice')}
          type="number"
          inputMode="decimal"
          step="0.01"
          value={String(line.unitPrice)}
          onChange={e => updateLine(index, { unitPrice: Number(e.target.value) || 0 })}
        />
      </div>
      <ClassificationPicker
        value={line.classificationCode}
        onChange={code => updateLine(index, { classificationCode: code })}
      />
      <div className="grid grid-cols-2 gap-3">
        <UomPicker
          value={line.uom}
          onChange={code => updateLine(index, { uom: code })}
        />
        <TaxSelector
          value={line.taxType}
          onChange={type => updateLine(index, { taxType: type })}
        />
      </div>
    </div>
  )
}
