'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/common/Button'
import { Input } from '@/components/common/Input'
import { getAccessToken, signOutGoogle, isGoogleAuthenticated } from '@/services/drive/driveAuth'
import { useInvoiceList } from '@/hooks/useInvoiceList'
import { LlmKeyManager } from '@/components/llm/LlmKeyManager'
import { MyInvoisCredsManager } from '@/components/settings/MyInvoisCredsManager'
import { NumberPresetManager } from '@/components/settings/NumberPresetManager'
import { PresetManager } from '@/components/presets/PresetManager'
import { PresetEditModal } from '@/components/presets/PresetEditModal'
import type { NumberPreset } from '@/lib/types'
import { useDemoStore } from '@/stores/demoStore'
import { useT } from '@/hooks/useT'

export default function SettingsPage() {
  const t = useT()
  const [authStatus, setAuthStatus] = useState<string | null>(null)
  const unlocked = useDemoStore(s => s.unlocked)
  const [passInput, setPassInput] = useState('')
  const [passError, setPassError] = useState('')
  const [editingPreset, setEditingPreset] = useState<NumberPreset | null>(null)
  const [showPresetModal, setShowPresetModal] = useState(false)
  const { refresh } = useInvoiceList()

  useEffect(() => {
    isGoogleAuthenticated().then(authed => {
      if (authed) setAuthStatus(t('settings.connected'))
    })
  }, [t])

  const checkPass = () => {
    if (passInput.toLowerCase() === 'unlock') {
      useDemoStore.getState().unlock()
      setPassInput('')
      setPassError('')
    } else {
      setPassError(t('settings.wrongPassword'))
    }
  }

  const lockDemo = () => {
    useDemoStore.getState().lock()
  }

  const checkAuth = async () => {
    const authed = await isGoogleAuthenticated()
    setAuthStatus(authed ? t('settings.connected') : t('settings.notConnected'))
  }

  const connectDrive = async () => {
    try {
      setAuthStatus('Opening Google sign-in...')
      await getAccessToken()
      setAuthStatus(t('settings.connected'))
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      setAuthStatus(`Failed: ${msg}`)
      console.error('[Drive Connect]', err)
    }
  }

  const disconnectDrive = async () => {
    await signOutGoogle()
    setAuthStatus('Disconnected from Google Drive')
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t('settings.title')} subtitle={t('settings.subtitle')} />

      <section className="bg-white rounded-lg border border-gray-200 p-4">
        <Link href="/profile" className="flex items-center justify-between hover:bg-gray-50 -m-4 p-4 rounded-lg transition-colors">
          <div>
            <h3 className="font-semibold text-gray-900">{t('settings.sellerProfile')}</h3>
            <p className="text-sm text-gray-500">{t('settings.sellerProfileDesc')}</p>
          </div>
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/>
          </svg>
        </Link>
      </section>

      <section className="mt-8">
        <PresetManager
          onEdit={(preset) => {
            setEditingPreset(preset)
            setShowPresetModal(true)
          }}
          onAdd={() => {
            setEditingPreset(null)
            setShowPresetModal(true)
          }}
        />
      </section>

      <NumberPresetManager />

      <section className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
        <h3 className="font-semibold text-gray-900">{t('settings.googleDriveSync')}</h3>
        <p className="text-sm text-gray-500">{t('settings.googleDriveSyncDesc')}</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={checkAuth}>{t('settings.checkStatus')}</Button>
          <Button variant="primary" size="sm" onClick={connectDrive}>{t('settings.connectDrive')}</Button>
          <Button variant="ghost" size="sm" onClick={disconnectDrive}>{t('settings.disconnectDrive')}</Button>
        </div>
        {authStatus && <p className="text-sm text-gray-600">{authStatus}</p>}
      </section>

      <LlmKeyManager />

      <MyInvoisCredsManager />

      <section className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">{t('settings.demoMode')}</h3>
            <p className="text-xs text-gray-400">{t('settings.demoModeDesc')}</p>
          </div>
          <button
            onClick={() => unlocked ? lockDemo() : null}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${unlocked ? 'bg-teal-600' : 'bg-gray-200'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${unlocked ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>
        {!unlocked && (
          <div className="flex gap-2">
            <Input
              type="password"
              placeholder="Enter password"
              value={passInput}
              onChange={e => { setPassInput(e.target.value); setPassError('') }}
              onKeyDown={e => e.key === 'Enter' && checkPass()}
              error={passError}
              className="flex-1"
            />
            <Button size="sm" onClick={checkPass}>{t('settings.unlock')}</Button>
          </div>
        )}
      </section>

      {showPresetModal && (
        <PresetEditModal
          preset={editingPreset}
          onClose={() => setShowPresetModal(false)}
          onSaved={() => {
            setShowPresetModal(false)
          }}
        />
      )}
    </div>
  )
}
