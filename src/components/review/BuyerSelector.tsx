'use client'
import { useInvoiceStore } from '@/stores/invoiceStore'
import { Button } from '@/components/common/Button'
import { Input } from '@/components/common/Input'
import { assertBuyerAllowed } from '@/services/compliance/tinValidator'
import { useState } from 'react'
import { useT } from '@/hooks/useT'

export function BuyerSelector() {
  const buyer = useInvoiceStore(s => s.buyer)
  const setBuyer = useInvoiceStore(s => s.setBuyer)
  const lines = useInvoiceStore(s => s.lines)
  const [tinInput, setTinInput] = useState(buyer.type === 'tin' ? buyer.tin : '')
  const [nameInput, setNameInput] = useState(buyer.type === 'tin' ? buyer.name : '')
  const [address, setAddress] = useState(buyer.type === 'tin' ? buyer.address ?? '' : '')
  const [city, setCity] = useState(buyer.type === 'tin' ? buyer.city ?? '' : '')
  const [postalZone, setPostalZone] = useState(buyer.type === 'tin' ? buyer.postalZone ?? '' : '')
  const [stateCode, setStateCode] = useState(buyer.type === 'tin' ? buyer.stateCode ?? '' : '')
  const [showAddress, setShowAddress] = useState(false)
  const [complianceWarning, setComplianceWarning] = useState<string | null>(null)
  const t = useT()

  const classificationCode = lines[0]?.classificationCode || ''

  const handleToggle = (type: 'general' | 'tin') => {
    if (type === 'general') {
      const result = assertBuyerAllowed({ type: 'general' }, classificationCode)
      if (!result.ok) {
        setComplianceWarning(result.error || 'General TIN only valid on consolidated (004) invoices')
      } else {
        setComplianceWarning(null)
      }
      setBuyer({ type: 'general' })
    } else {
      setComplianceWarning(null)
      setBuyer({ type: 'tin', tin: tinInput, name: nameInput, idType: 'BRN', idValue: '' })
    }
  }

  const updateTin = (tin: string, name: string) => {
    setTinInput(tin)
    setNameInput(name)
    if (buyer.type === 'tin') {
      setBuyer({ ...buyer, tin, name })
    }
  }

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-gray-700">{t('invoice.buyerLabel')}</label>
      <div className="flex gap-2">
        <Button
          type="button"
          variant={buyer.type === 'general' ? 'primary' : 'outline'}
          size="sm"
          aria-pressed={buyer.type === 'general'}
          onClick={() => handleToggle('general')}
        >
          {t('invoice.generalPublic')}
        </Button>
        <Button
          type="button"
          variant={buyer.type === 'tin' ? 'primary' : 'outline'}
          size="sm"
          aria-pressed={buyer.type === 'tin'}
          onClick={() => handleToggle('tin')}
        >
          {t('invoice.namedBuyer')}
        </Button>
      </div>
      {complianceWarning && (
        <p role="alert" className="text-xs text-amber-600">{complianceWarning}</p>
      )}
      {buyer.type === 'tin' && (
        <>
          <div className="grid grid-cols-2 gap-2">
            <Input
              label={t('invoice.buyerName')}
              value={nameInput}
              onChange={e => updateTin(tinInput, e.target.value)}
            />
            <Input
              label={t('invoice.buyerTin')}
              value={tinInput}
              onChange={e => updateTin(e.target.value, nameInput)}
              placeholder="C1234567890"
            />
          </div>
          <button
            type="button"
            onClick={() => setShowAddress(v => !v)}
            aria-expanded={showAddress}
            className="w-full text-left text-xs font-medium text-teal-700 flex items-center gap-1 mt-1 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
          >
            {showAddress ? '\u25BE' : '\u25B8'} Buyer Address (optional)
          </button>
          {showAddress && (
            <div className="grid grid-cols-2 gap-2 mt-1">
              <Input
                label="Address"
                value={address}
                onChange={e => {
                  setAddress(e.target.value)
                  if (buyer.type === 'tin') {
                    setBuyer({ ...buyer, address: e.target.value })
                  }
                }}
              />
              <Input
                label="City"
                value={city}
                onChange={e => {
                  setCity(e.target.value)
                  if (buyer.type === 'tin') {
                    setBuyer({ ...buyer, city: e.target.value })
                  }
                }}
              />
              <Input
                label="Postal Code"
                value={postalZone}
                onChange={e => {
                  setPostalZone(e.target.value)
                  if (buyer.type === 'tin') {
                    setBuyer({ ...buyer, postalZone: e.target.value })
                  }
                }}
              />
              <Input
                label="State Code"
                value={stateCode}
                onChange={e => {
                  setStateCode(e.target.value)
                  if (buyer.type === 'tin') {
                    setBuyer({ ...buyer, stateCode: e.target.value })
                  }
                }}
              />
            </div>
          )}
        </>
      )}
      {buyer.type === 'general' && classificationCode !== '004' && (
        <p role="alert" className="text-xs text-amber-600">
          {t('invoice.tinBuyerWarning')}
        </p>
      )}
    </div>
  )
}
