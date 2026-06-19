'use client'
import { useState } from 'react'
import { useInvoiceStore } from '@/stores/invoiceStore'
import { Button } from '@/components/common/Button'
import { Input } from '@/components/common/Input'
import { useT } from '@/hooks/useT'

export function ManualEntryForm() {
  const addLine = useInvoiceStore(s => s.addLine)
  const [form, setForm] = useState({ description: '', qty: '1', unitPrice: '' })
  const [added, setAdded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const t = useT()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.description || !form.unitPrice) {
      setError(t('create.missingFields') || 'Please fill in description and unit price.')
      return
    }
    setError(null)
    addLine({
      description: form.description,
      qty: Number(form.qty) || 1,
      unitPrice: Number(form.unitPrice) || 0,
      uom: 'C62',
      classificationCode: '',
      taxType: '06',
      taxAmount: 0,
    })
    setForm({ description: '', qty: '1', unitPrice: '' })
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && (
        <p role="alert" className="text-sm text-red-600">{error}</p>
      )}
      <div className="grid grid-cols-3 gap-2">
        <div className="col-span-2">
          <Input
            aria-label="Item description"
            placeholder={t('create.itemDescription')}
            value={form.description}
            onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
            required
          />
        </div>
        <Input
          aria-label="Quantity"
          type="number"
          inputMode="decimal"
          placeholder={t('create.qty')}
          value={form.qty}
          onChange={e => setForm(prev => ({ ...prev, qty: e.target.value }))}
          min="1"
        />
      </div>
      <div className="flex items-center gap-2">
        <Input
          aria-label="Unit price RM"
          type="number"
          inputMode="decimal"
          placeholder={t('create.unitPrice')}
          value={form.unitPrice}
          onChange={e => setForm(prev => ({ ...prev, unitPrice: e.target.value }))}
          step="0.01"
          min="0"
          required
          className="flex-1"
        />
        <Button type="submit" size="sm">
          {added ? t('create.added') : t('create.addLine')}
        </Button>
      </div>
    </form>
  )
}
