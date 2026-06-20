'use client'
import { useState, useCallback, useRef } from 'react'
import { Button } from '@/components/common/Button'
import { useT } from '@/hooks/useT'

interface VoiceCaptureProps {
  onTranscript: (text: string) => void
  /** 'full' shows label + transcript panel; 'icon' is a compact mic button for input rows. */
  variant?: 'full' | 'icon'
  disabled?: boolean
}

const MIC_PATH = 'M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z'
const STOP_PATH = 'M5.25 7.5A2.25 2.25 0 017.5 5.25h9a2.25 2.25 0 012.25 2.25v9a2.25 2.25 0 01-2.25 2.25h-9a2.25 2.25 0 01-2.25-2.25v-9z'

export function VoiceCapture({ onTranscript, variant = 'full', disabled = false }: VoiceCaptureProps) {
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [speechError, setSpeechError] = useState<string | null>(null)
  const recognitionRef = useRef<any>(null)
  const t = useT()

  const start = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      setSpeechError('Speech recognition not supported in this browser')
      return
    }
    const recognition = new SpeechRecognition()
    recognition.lang = 'ms-MY'
    recognition.continuous = false
    recognition.interimResults = false

    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript as string
      setTranscript(text)
      onTranscript(text)
      setListening(false)
    }

    recognition.onerror = () => {
      setListening(false)
    }

    recognition.onend = () => {
      setListening(false)
    }

    recognitionRef.current = recognition
    recognition.start()
    setListening(true)
  }, [onTranscript])

  const stop = useCallback(() => {
    recognitionRef.current?.stop()
    setListening(false)
  }, [])

  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={listening ? stop : start}
        disabled={disabled}
        aria-label={listening ? 'Stop recording' : 'Record voice question'}
        aria-pressed={listening}
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50 ${
          listening
            ? 'animate-pulse border-red-300 bg-red-50 text-red-600'
            : 'border-gray-300 text-gray-500 hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700'
        }`}
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d={listening ? STOP_PATH : MIC_PATH} />
        </svg>
      </button>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {!listening ? (
          <Button type="button" variant="outline" onClick={start} aria-pressed={listening}>
            <span className="flex items-center gap-1.5">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d={MIC_PATH}/></svg>
              {t('create.startRecording')}
            </span>
          </Button>
        ) : (
          <Button type="button" variant="secondary" onClick={stop} aria-pressed={listening}>
            <span className="flex items-center gap-1.5">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d={STOP_PATH}/></svg>
              {t('create.stop')}
            </span>
          </Button>
        )}
      </div>
      {speechError && <p role="alert" className="text-sm text-red-600">{speechError}</p>}
      {transcript && (
        <div role="status" aria-live="polite" className="bg-gray-100 rounded-lg p-3 text-sm text-gray-700">
          &ldquo;{transcript}&rdquo;
        </div>
      )}
      {listening && <p className="text-sm text-teal-600 animate-pulse">{t('create.listening')}</p>}
    </div>
  )
}
