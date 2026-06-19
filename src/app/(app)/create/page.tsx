'use client'
import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { CaptureModeSwitcher } from '@/components/capture/CaptureModeSwitcher'
import { ExtractedItemsTable } from '@/components/review/ExtractedItemsTable'
import { LineItemEditor } from '@/components/review/LineItemEditor'
import { BuyerSelector } from '@/components/review/BuyerSelector'
import { useInvoice, type FinalizeOptions } from '@/hooks/useInvoice'
import { useInvoiceStore } from '@/stores/invoiceStore'
import { useProfileStore } from '@/stores/profileStore'
import { profileRepository } from '@/services/data/profileRepository'
import { formatInvoiceNumber, cloneDefaultPresets } from '@/lib/numbering'
import { formatMYR } from '@/lib/formatters'
import { Button } from '@/components/common/Button'
import { Input } from '@/components/common/Input'
import { Select } from '@/components/common/Select'
import { PageHeader } from '@/components/layout/PageHeader'
import { NoLlmBanner } from '@/components/common/NoLlmBanner'
import { useT } from '@/hooks/useT'

const PAYMENT_METHOD_OPTIONS = [
  { value: '', label: '- Select -' },
  { value: '01', label: '01 - Cash' },
  { value: '02', label: '02 - Cheque' },
  { value: '03', label: '03 - Credit Card' },
  { value: '04', label: '04 - Debit Card' },
  { value: '05', label: '05 - Digital Wallet / E-Money' },
  { value: '06', label: '06 - Bank Transfer / FPX / GIRO' },
  { value: '07', label: '07 - Direct Debit' },
  { value: '08', label: '08 - Standing Instruction' },
  { value: '99', label: '99 - Others' },
]

export default function CreatePage() {
  const router = useRouter()
  const t = useT()
  const lines = useInvoiceStore(s => s.lines)
  const { finalize, loading, error: finalizeError } = useInvoice()
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)

  const profile = useProfileStore(s => s.profile)

  const presets = useMemo(() => {
    if (profile?.numberingPresets && profile.numberingPresets.length > 0) {
      return profile.numberingPresets
    }
    return cloneDefaultPresets()
  }, [profile])

  const [selectedPresetId, setSelectedPresetId] = useState('')
  const [tokenValues, setTokenValues] = useState<Record<string, string>>({})

  const activePreset = useMemo(
    () => presets.find(p => p.id === selectedPresetId) ?? presets.find(p => p.isDefault) ?? presets[0],
    [presets, selectedPresetId]
  )

  useEffect(() => {
    if (presets.length > 0 && !selectedPresetId) {
      const def = presets.find(p => p.isDefault) ?? presets[0]
      setSelectedPresetId(def.id)
    }
  }, [presets, selectedPresetId])

  const preview = useMemo(() => {
    if (!activePreset) return ''
    const { number } = formatInvoiceNumber(activePreset, tokenValues)
    return number
  }, [activePreset, tokenValues])

  useEffect(() => {
    if (preview && !invoiceNumber) {
      setInvoiceNumber(preview)
    }
  }, [preview, invoiceNumber])

  const customTokenKeys = useMemo(() => {
    if (!activePreset) return []
    return Object.keys(activePreset.customTokens)
  }, [activePreset])

  useEffect(() => {
    setInvoiceNumber('')
    if (activePreset) {
      const init: Record<string, string> = {}
      for (const [key, def] of Object.entries(activePreset.customTokens)) {
        init[key] = def.default ?? ''
      }
      setTokenValues(init)
    }
  }, [activePreset?.id])

  const [discAmount, setDiscAmount] = useState('')
  const [discReason, setDiscReason] = useState('')
  const [payMethod, setPayMethod] = useState('')
  const [payTerms, setPayTerms] = useState('')
  const [payDueDate, setPayDueDate] = useState('')
  const [suppRef, setSuppRef] = useState('')
  const [noteText, setNoteText] = useState('')

  const handleGenerate = async () => {
    await profileRepository.ensurePresets(profile!)
    const options: FinalizeOptions = {
      invoiceNumber: invoiceNumber || undefined,
      tokenValues,
    }
    if (showAdvanced) {
      if (discAmount) options.discount = { amount: parseFloat(discAmount) || 0, reason: discReason || undefined }
      if (payMethod || payDueDate) options.payment = { method: payMethod || undefined, terms: payTerms || undefined, dueDate: payDueDate || undefined }
      if (suppRef) options.supplierRef = suppRef
      if (noteText) options.notes = noteText
    }
    const invoice = await finalize(options)
    if (invoice) {
      router.push(`/invoice?id=${invoice.id}`)
    }
  }

  const updateToken = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setTokenValues(prev => ({ ...prev, [key]: e.target.value }))
  }

  return (
    <div className="space-y-6 pb-32 lg:pb-24">
      <PageHeader title={t('create.title')} subtitle={t('create.subtitle')} />

      <NoLlmBanner context="create" />

      <section>
        <CaptureModeSwitcher />
      </section>

      {lines.length === 0 && (
        <div className="mt-4 text-center text-sm text-gray-500 bg-gray-50 border border-dashed border-gray-300 rounded-lg p-6">
          <p className="font-medium text-gray-700 mb-1">No items yet</p>
          <p>Add items using Camera, Voice, or Manual entry above.</p>
        </div>
      )}

      {lines.length > 0 && (
        <>
          <section>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">{t('create.lineItemsCount', { n: lines.length })}</h3>
            <ExtractedItemsTable />
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700">
              {t('create.editItems')} {editingIndex !== null ? '' : t('create.editItemsHint')}
            </h3>
            {lines.map((_, i) => (
              <div key={i} className="flex gap-2 items-center">
                <Button
                  variant={editingIndex === i ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setEditingIndex(editingIndex === i ? null : i)}
                >
                  {lines[i].description.slice(0, 20)} - RM {formatMYR(lines[i].amount)}
                </Button>
              </div>
            ))}
            {editingIndex !== null && (
              <div className="mt-3">
                <LineItemEditor index={editingIndex} />
              </div>
            )}
          </section>

          <section>
            <BuyerSelector />
          </section>

          <section className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700">{t('invoice.invoiceNumber')}</h3>
              <button
                type="button"
                onClick={() => router.push('/settings?tab=presets')}
                className="flex items-center justify-center w-11 h-11 rounded-full hover:bg-gray-100 text-gray-500"
                aria-label="Settings"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </div>

            <select
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-teal-700"
              value={selectedPresetId}
              onChange={e => setSelectedPresetId(e.target.value)}
            >
              {presets.map(p => (
                <option key={p.id} value={p.id}>{p.name}{p.isDefault ? ' \u2605' : ''}</option>
              ))}
            </select>

            {customTokenKeys.map(key => (
              <Input
                key={key}
                label={activePreset.customTokens[key].label}
                value={tokenValues[key] ?? ''}
                onChange={updateToken(key)}
                placeholder={activePreset.customTokens[key].default || activePreset.customTokens[key].label}
              />
            ))}

            <p className="text-xs text-gray-500 tabular-nums">
              Preview: <span className="font-mono text-teal-700">{preview}</span>
            </p>

            <Input
              label="Number (editable)"
              value={invoiceNumber}
              onChange={e => setInvoiceNumber(e.target.value)}
              placeholder={preview}
            />
          </section>

          <section>
            <button
              type="button"
              onClick={() => setShowAdvanced(v => !v)}
              aria-expanded={showAdvanced}
              className="w-full text-left text-sm font-medium text-teal-700 flex items-center gap-1"
            >
              <svg
                className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-90' : ''}`}
                fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
              {t('create.advancedOptions')}
            </button>
            {showAdvanced && (
              <div className="mt-2 space-y-3 border border-gray-200 rounded-lg p-3 bg-gray-50">
                <Input label="Discount Amount (RM)" type="number" inputMode="decimal" placeholder="0.00" value={discAmount} onChange={e => setDiscAmount(e.target.value)} />
                <Input label="Discount Reason" placeholder="Promotional discount" value={discReason} onChange={e => setDiscReason(e.target.value)} />
                <Select
                  label="Payment Method"
                  options={PAYMENT_METHOD_OPTIONS}
                  value={payMethod}
                  onChange={e => setPayMethod(e.target.value)}
                />
                <Input label="Payment Terms" placeholder="Net 30" value={payTerms} onChange={e => setPayTerms(e.target.value)} />
                <Input label="Due Date" type="date" value={payDueDate} onChange={e => setPayDueDate(e.target.value)} />
                <Input label="Supplier Reference" placeholder="Your internal ref" value={suppRef} onChange={e => setSuppRef(e.target.value)} />
                <Input label="Notes" placeholder="Any remarks" value={noteText} onChange={e => setNoteText(e.target.value)} />
              </div>
            )}
          </section>

          <div className="flex flex-col items-center gap-2 pb-8">
            <Button
              variant="primary"
              size="lg"
              onClick={handleGenerate}
              loading={loading}
              disabled={lines.length === 0}
            >
              {t('create.generateButton')}
            </Button>
            {finalizeError && <p className="text-sm text-red-600">{finalizeError}</p>}
          </div>
        </>
      )}
    </div>
  )
}
