'use client'
import { useEffect, useState } from 'react'
import { myInvoisCredsRepository, type MyInvoisCreds } from '@/services/data/myInvoisCredsRepository'
import { Button } from '@/components/common/Button'
import { Input } from '@/components/common/Input'
import { CredentialHint } from './CredentialHint'

function mask(s: string): string {
  if (!s) return ''
  if (s.length <= 8) return '••••'
  return s.slice(0, 4) + '••••' + s.slice(-4)
}

const STEPS = [
  'Log in to the MyInvois portal (preprod.myinvois.hasil.gov.my) with your IC.',
  'Open your Profile, then choose "View / Register ERP".',
  'Add a new ERP (any name, e.g. SenangInvoice) and pick a Client Secret expiry.',
  'Click Register - copy the generated Client ID and Client Secret (secret shows once).',
  'Paste both here. They are stored only on this device.',
]

export function MyInvoisCredsManager() {
  const [saved, setSaved] = useState<MyInvoisCreds | null>(null)
  const [editing, setEditing] = useState(false)
  const [label, setLabel] = useState('')
  const [clientId, setClientId] = useState('')
  const [clientSecret, setClientSecret] = useState('')
  const [status, setStatus] = useState('')

  const load = () => myInvoisCredsRepository.get().then(setSaved)
  useEffect(() => { load() }, [])

  const startEdit = () => {
    setLabel(saved?.label ?? '')
    setClientId(saved?.clientId ?? '')
    setClientSecret(saved?.clientSecret ?? '')
    setEditing(true)
  }

  const save = async () => {
    if (!label || !clientId || !clientSecret) return
    await myInvoisCredsRepository.save({ label, clientId, clientSecret })
    setEditing(false)
    setStatus('Saved ✓'); setTimeout(() => setStatus(''), 3000)
    await load()
  }

  const clear = async () => {
    await myInvoisCredsRepository.clear()
    setEditing(false)
    await load()
  }

  return (
    <section className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
      <div>
        <h3 className="font-semibold text-gray-900">MyInvois API Credentials</h3>
        <p className="text-sm text-gray-500">Your own ERP credentials. Stored only on this device, used to submit e-invoices as you.</p>
      </div>

      <CredentialHint steps={STEPS} />

      {saved && !editing && (
        <div className="space-y-2">
          <div className="text-xs font-mono text-gray-600 bg-gray-50 rounded p-2">
            <div className="font-sans font-medium text-gray-800">{saved.label}</div>
            <div>Client ID: {mask(saved.clientId)}</div>
            <div>Client Secret: {mask(saved.clientSecret)}</div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={startEdit}>Edit</Button>
            <Button size="sm" variant="ghost" onClick={clear}>Clear</Button>
          </div>
        </div>
      )}

      {(!saved || editing) && (
        <div className="space-y-2">
          <Input label="Label" value={label} onChange={e => setLabel(e.target.value)} placeholder="My Sdn Bhd" />
          <Input label="Client ID" value={clientId} onChange={e => setClientId(e.target.value)} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" />
          <Input label="Client Secret" type="password" value={clientSecret} onChange={e => setClientSecret(e.target.value)} placeholder="paste secret" />
          <div className="flex items-center gap-2">
            <Button onClick={save} disabled={!label || !clientId || !clientSecret}>Save</Button>
            {editing && <Button variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>}
            {status && <span className="text-sm text-green-600">{status}</span>}
          </div>
        </div>
      )}
    </section>
  )
}
