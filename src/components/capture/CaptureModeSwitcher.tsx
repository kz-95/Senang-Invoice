'use client'
import { useUiStore } from '@/stores/uiStore'
import { CameraCapture } from './CameraCapture'
import { VoiceCapture } from './VoiceCapture'
import { ManualEntryForm } from './ManualEntryForm'
import { useCapture } from '@/hooks/useCapture'
import { useExtraction } from '@/hooks/useExtraction'
import { useT } from '@/hooks/useT'

export function CaptureModeSwitcher() {
  const captureMode = useUiStore(s => s.captureMode)
  const setCaptureMode = useUiStore(s => s.setCaptureMode)
  const { extract, loading: extracting, ocrProgress, error } = useExtraction()
  const t = useT()

  const cameraSvg = <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"/><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z"/></svg>
  const micSvg = <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"/></svg>
  const pencilSvg = <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"/></svg>

  const modes = [
    { key: 'camera' as const, label: t('create.cameraTab'), icon: cameraSvg },
    { key: 'voice' as const, label: t('create.voiceTab'), icon: micSvg },
    { key: 'manual' as const, label: t('create.manualTab'), icon: pencilSvg },
  ]

  return (
    <div className="space-y-4">
      {/* Content card */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        {/* Segmented control — inside card, at top */}
        <div role="tablist" aria-label="Capture mode" className="mx-auto grid w-full max-w-2xl grid-cols-3 gap-1 mb-4 rounded-xl bg-gray-100 p-1">
          {modes.map(m => {
            const active = captureMode === m.key
            return (
              <button
                key={m.key}
                role="tab"
                aria-selected={active}
                onClick={() => setCaptureMode(m.key)}
                className={`flex min-h-[48px] items-center justify-center gap-1.5 rounded-xl text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-1 ${
                  active
                    ? 'bg-teal-700 text-white shadow-sm'
                    : 'bg-transparent text-gray-600 hover:bg-white'
                }`}
              >
                {m.icon}
                {m.label}
              </button>
            )
          })}
        </div>

        {captureMode === 'camera' && (
          <CameraCapture onCapture={async (base64) => { await extract({ imageBase64: base64 }) }} />
        )}

        {captureMode === 'voice' && (
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-teal-50 text-teal-700">
              {micSvg}
            </div>
            <div>
              <p className="font-medium text-gray-900">{t('create.speakItems')}</p>
              <p className="mt-1 text-sm text-gray-500">{t('create.speakItemsHint')}</p>
            </div>
            <VoiceCapture onTranscript={async (text) => { await extract({ transcript: text }) }} />
          </div>
        )}

        {captureMode === 'manual' && <ManualEntryForm />}

        {ocrProgress && (
          <p className="mt-3 flex items-center justify-center gap-2 text-sm text-amber-600">
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" />
            {ocrProgress}
          </p>
        )}
        {extracting && (
          <p className="mt-3 flex items-center justify-center gap-2 text-sm text-teal-600">
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
            {t('create.extracting')}
          </p>
        )}
        {error && (
          <p role="alert" className="mt-3 text-center text-sm text-red-600">
            {t('create.error', { error: String(error) })}
          </p>
        )}
      </div>
    </div>
  )
}
