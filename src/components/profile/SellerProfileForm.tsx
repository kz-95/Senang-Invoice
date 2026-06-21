'use client'
import { useState, useEffect } from 'react'
import { useProfile } from '@/hooks/useProfile'
import { profileRepository } from '@/services/data/profileRepository'
import { Button } from '@/components/common/Button'
import { Input } from '@/components/common/Input'
import { MyInvoisCredsManager } from '@/components/settings/MyInvoisCredsManager'
import { NumberPresetManager } from '@/components/settings/NumberPresetManager'
import { track } from '@/lib/analytics'
import { useT } from '@/hooks/useT'

function CollapsibleHint({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const chevron = (
    <svg className={`w-3 h-3 transition-transform ${open ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  )
  return (
    <div className="mt-1">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="text-xs text-teal-600 hover:text-teal-800 flex items-center gap-1"
      >
        {chevron}
        {label}
      </button>
      {open && (
        <div className="mt-1.5 p-2 bg-teal-50 border border-teal-100 rounded-md text-xs text-gray-600 leading-relaxed">
          {children}
        </div>
      )}
    </div>
  )
}

export function SellerProfileForm() {
  const { profile, save } = useProfile()
  const t = useT()

  const [form, setForm] = useState({
    id: '',
    businessName: '',
    tin: '',
    sstReg: '',
    msicCode: '',
    address: '',
    phone: '',
    email: '',
    city: '',
    postalZone: '',
    stateCode: '',
  })

  useEffect(() => {
    if (profile) {
      setForm({
        id: profile.id,
        businessName: profile.businessName,
        tin: profile.tin,
        sstReg: profile.sstReg,
        msicCode: profile.msicCode,
        address: profile.address,
        phone: profile.phone,
        email: profile.email,
        city: profile.city ?? '',
        postalZone: profile.postalZone ?? '',
        stateCode: profile.stateCode ?? '',
      })
    }
  }, [profile])

  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showAdvancedAddr, setShowAdvancedAddr] = useState(false)
  const [showNumbering, setShowNumbering] = useState(false)

  // Advanced (ERP MyInvois) modal — no PIN gate
  const [showAdvancedModal, setShowAdvancedModal] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const existing = await profileRepository.get()
      const preservedPresets = existing?.numberingPresets ?? profile?.numberingPresets ?? []
      await profileRepository.ensurePresets({ ...existing ?? profile!, numberingPresets: preservedPresets })

      await save({
        id: profile?.id ?? crypto.randomUUID(),
        businessName: form.businessName,
        tin: form.tin,
        sstReg: form.sstReg,
        msicCode: form.msicCode,
        address: form.address,
        phone: form.phone,
        email: form.email,
        city: form.city,
        postalZone: form.postalZone,
        stateCode: form.stateCode,
        numberingPresets: preservedPresets,
      })
      track('profile_complete')
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('profile.couldNotSave'))
    } finally {
      setSaving(false)
    }
  }

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }))

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Header row: Seller Profile title | Advanced link */}
      <div className="flex items-center justify-between -mb-2">
        <div />
        <button
          type="button"
          onClick={() => setShowAdvancedModal(true)}
          className="text-sm font-medium text-teal-600 hover:text-teal-800 flex items-center gap-1"
        >
          Advanced
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
          </svg>
        </button>
      </div>

      <Input label={t('profile.businessName')} value={form.businessName} onChange={update('businessName')} required />

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Input label={t('profile.tin')} value={form.tin} onChange={update('tin')} placeholder="C1234567890" required />
          <CollapsibleHint label="What is TIN?">
            <strong>Tax Identification Number (TIN)</strong> is a unique identifier issued by LHDN (Inland Revenue Board).
            For businesses, the format is <code className="bg-teal-100 px-1 rounded">C1234567890</code> (12 digits starting with a letter).
            You can find your TIN on your income tax return form (Borang B/BE) or by checking the MyTax portal (mytax.hasil.gov.my).
          </CollapsibleHint>
        </div>
        <div>
          <Input label={t('profile.sstReg')} value={form.sstReg} onChange={update('sstReg')} placeholder="W10-1234-56789012" />
          <CollapsibleHint label="What is SST Reg No?">
            <strong>Sales and Service Tax Registration Number</strong>. Only needed if your business is registered for SST.
            Format: <code className="bg-teal-100 px-1 rounded">W10-1234-56789012</code> (starts with a letter, then digits).
            Find it on your SST registration certificate from the Royal Malaysian Customs Department (mysst.customs.gov.my).
          </CollapsibleHint>
        </div>
      </div>

      <div>
        <Input label={t('profile.msicCode')} value={form.msicCode} onChange={update('msicCode')} placeholder="47111" />
        <CollapsibleHint label="What is MSIC Code?">
          <strong>Malaysia Standard Industrial Classification (MSIC)</strong> code classifies your business activity.
          5-digit code. Examples: <code className="bg-teal-100 px-1 rounded">47111</code> = Grocery stores,{' '}
          <code className="bg-teal-100 px-1 rounded">56111</code> = Restaurants.
          Look up your code at <span className="text-teal-700">msic.dosm.gov.my</span> or refer to your SSM registration documents.
        </CollapsibleHint>
      </div>

      <Input label={t('profile.address')} value={form.address} onChange={update('address')} />
      <div className="grid grid-cols-2 gap-3">
        <Input label={t('profile.phone')} value={form.phone} onChange={update('phone')} type="tel" />
        <Input label={t('profile.email')} value={form.email} onChange={update('email')} type="email" />
      </div>

      <div className="border-t pt-3">
        <button type="button" onClick={() => setShowAdvancedAddr(v => !v)} aria-expanded={showAdvancedAddr} className="w-full text-left text-sm font-medium text-teal-700 flex items-center gap-1">
          <svg className={`w-3.5 h-3.5 transition-transform ${showAdvancedAddr ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          Advanced Address (optional)
        </button>
        {showAdvancedAddr && (
          <div className="mt-2 space-y-3 border border-gray-200 rounded-lg p-3 bg-gray-50">
            <Input label="City" value={form.city} onChange={update('city')} placeholder="Kuala Lumpur" />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Postal Code" value={form.postalZone} onChange={update('postalZone')} placeholder="50000" />
              <Input label="State Code" value={form.stateCode} onChange={update('stateCode')} placeholder="14" />
            </div>
          </div>
        )}
      </div>

      {/* Invoice Numbering Settings */}
      <div className="border-t pt-3">
        <button
          type="button"
          onClick={() => setShowNumbering(v => !v)}
          className="w-full text-left text-sm font-medium text-teal-700 flex items-center gap-1"
        >
          <svg className={`w-3.5 h-3.5 transition-transform ${showNumbering ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          Invoice Numbering Settings
        </button>
        {showNumbering && (
          <div className="mt-2">
            <NumberPresetManager />
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" loading={saving}>
          {saved ? t('profile.savedProfile') : t('profile.saveProfile')}
        </Button>
        {saved && <span className="text-sm text-green-600">{t('profile.profileSaved')}</span>}
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-600">{error}</p>
      )}

      {/* Advanced Modal — MyInvois ERP Credentials */}
      {showAdvancedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowAdvancedModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-lg w-full mx-4 max-h-[85vh] overflow-y-auto space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">ERP MyInvois Setup</h3>
              <button
                type="button"
                onClick={() => setShowAdvancedModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <MyInvoisCredsManager />
          </div>
        </div>
      )}
    </form>
  )
}
