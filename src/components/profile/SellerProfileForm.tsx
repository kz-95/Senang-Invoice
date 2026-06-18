'use client'
import { useState, useEffect } from 'react'
import { useProfile } from '@/hooks/useProfile'
import { profileRepository } from '@/services/data/profileRepository'
import { Button } from '@/components/common/Button'
import { Input } from '@/components/common/Input'
import { useT } from '@/hooks/useT'

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
      <Input label={t('profile.businessName')} value={form.businessName} onChange={update('businessName')} required />
      <div className="grid grid-cols-2 gap-3">
        <Input label={t('profile.tin')} value={form.tin} onChange={update('tin')} placeholder="C1234567890" required />
        <Input label={t('profile.sstReg')} value={form.sstReg} onChange={update('sstReg')} placeholder="SST-1234" />
      </div>
      <Input label={t('profile.msicCode')} value={form.msicCode} onChange={update('msicCode')} placeholder="47111" />
      <Input label={t('profile.address')} value={form.address} onChange={update('address')} />
      <div className="grid grid-cols-2 gap-3">
        <Input label={t('profile.phone')} value={form.phone} onChange={update('phone')} type="tel" />
        <Input label={t('profile.email')} value={form.email} onChange={update('email')} type="email" />
      </div>

      <div className="border-t pt-3">
        <button type="button" onClick={() => setShowAdvancedAddr(v => !v)} aria-expanded={showAdvancedAddr} className="w-full text-left text-sm font-medium text-teal-700 flex items-center gap-1">
          {showAdvancedAddr ? '\u25BE' : '\u25B8'} Advanced Address (optional)
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

      <p className="text-xs text-gray-500">
        Invoice numbering presets are managed in Settings → Numbering Presets.
      </p>

      <div className="flex items-center gap-3">
        <Button type="submit" loading={saving}>
          {saved ? t('profile.savedProfile') : t('profile.saveProfile')}
        </Button>
        {saved && <span className="text-sm text-green-600">{t('profile.profileSaved')}</span>}
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-600">{error}</p>
      )}
    </form>
  )
}
