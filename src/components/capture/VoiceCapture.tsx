'use client'
import { useState, useCallback, useRef, useEffect } from 'react'
import { useT } from '@/hooks/useT'
import { useUiStore } from '@/stores/uiStore'
import type { Lang } from '@/lib/types'

// Map the app UI language to a BCP-47 speech-recognition locale.
// en -> en-MY: Malaysian English. Locals routinely mix Malay loanwords
// ("nasi lemak", "tapau") into English speech; the en-MY acoustic/language
// model handles that rojak far better than en-US.
const RECOGNITION_LANG: Record<Lang, string> = {
  en: 'en-MY',
  ms: 'ms-MY',
  zh: 'zh-CN',
}

function recognitionLangFor(lang: Lang): string {
  return RECOGNITION_LANG[lang] ?? 'en-MY'
}

async function isNativePlatform(): Promise<boolean> {
  try {
    const { Capacitor } = await import('@capacitor/core')
    return Capacitor.isNativePlatform?.() ?? false
  } catch {
    return false
  }
}

interface VoiceCaptureProps {
  onTranscript: (text: string) => void
  /** 'full' = WhatsApp-style circular mic button + timer; 'icon' = compact mic button for input rows. */
  variant?: 'full' | 'icon'
  disabled?: boolean
}

const MAX_DURATION = 60 // seconds

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function VoiceCapture({ onTranscript, variant = 'full', disabled = false }: VoiceCaptureProps) {
  const [listening, setListening] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [interimText, setInterimText] = useState('')
  const [finalText, setFinalText] = useState('')
  const [speechError, setSpeechError] = useState<string | null>(null)
  const recognitionRef = useRef<any>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const accumulatedRef = useRef<string[]>([])
  const engineRef = useRef<'web' | 'native' | null>(null)
  const partialHandleRef = useRef<{ remove: () => void } | null>(null)
  const t = useT()

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const stopRecognition = useCallback(() => {
    try { recognitionRef.current?.stop() } catch {}
    recognitionRef.current = null
    if (engineRef.current === 'native') {
      partialHandleRef.current?.remove()
      partialHandleRef.current = null
      void import('@capacitor-community/speech-recognition')
        .then(({ SpeechRecognition }) => SpeechRecognition.stop())
        .catch(() => {})
    }
    engineRef.current = null
    clearTimer()
    setListening(false)
  }, [clearTimer])

  // Auto-stop at max duration
  useEffect(() => {
    if (elapsed >= MAX_DURATION && listening) {
      stopRecognition()
      const text = accumulatedRef.current.join(' ').trim()
      if (text) {
        setFinalText(text)
        onTranscript(text)
      }
    }
  }, [elapsed, listening, stopRecognition, onTranscript])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      try { recognitionRef.current?.stop() } catch {}
      if (engineRef.current === 'native') {
        partialHandleRef.current?.remove()
        void import('@capacitor-community/speech-recognition')
          .then(({ SpeechRecognition }) => SpeechRecognition.stop())
          .catch(() => {})
      }
      clearTimer()
    }
  }, [clearTimer])

  const start = useCallback(async () => {
    setSpeechError(null)
    accumulatedRef.current = []
    setFinalText('')
    setInterimText('')
    setElapsed(0)

    // Native APK: the Android System WebView has no Web Speech API, so the
    // browser SpeechRecognition path below never works. Use the OS speech
    // recognizer (free, no API key, live partial results) via the community
    // plugin instead. Web browsers keep the SpeechRecognition path.
    if (await isNativePlatform()) {
      try {
        const { SpeechRecognition: NativeSR } = await import('@capacitor-community/speech-recognition')
        const avail = await NativeSR.available()
        if (!avail.available) {
          setSpeechError('Speech recognition unavailable on this device. Update Google app / Speech Services.')
          return
        }
        const perm = await NativeSR.checkPermissions()
        if (perm.speechRecognition !== 'granted') {
          const req = await NativeSR.requestPermissions()
          if (req.speechRecognition !== 'granted') {
            setSpeechError('Microphone not allowed. Open Settings → Apps → Senang Inv → Permissions → enable Microphone.')
            return
          }
        }
        partialHandleRef.current = await NativeSR.addListener('partialResults', (data: { matches?: string[] }) => {
          const text = data.matches?.[0] ?? ''
          setInterimText(text)
          accumulatedRef.current = text ? [text] : []
        })
        const recLang = recognitionLangFor(useUiStore.getState().lang)
        await NativeSR.start({ language: recLang, partialResults: true, popup: false })
        engineRef.current = 'native'
        setListening(true)
        timerRef.current = setInterval(() => setElapsed(prev => prev + 1), 1000)
      } catch (err: any) {
        setSpeechError(`Voice error: ${err?.message || 'failed to start recording'}`)
      }
      return
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      setSpeechError('Speech recognition not supported. Ensure Google app is installed and updated.')
      return
    }

    // Use native Capacitor plugin for reliable mic permission on Android WebView.
    // getUserMedia often fails in Capacitor (especially Xiaomi) even when OS
    // permission is granted — the native plugin forces the proper OS dialog.
    try {
      const { VoiceRecorder } = await import('capacitor-voice-recorder')
      const hasPermission = await VoiceRecorder.hasAudioRecordingPermission()
      if (!hasPermission.value) {
        await VoiceRecorder.requestAudioRecordingPermission()
      }
      const granted = await VoiceRecorder.hasAudioRecordingPermission()
      if (!granted.value) {
        setSpeechError('Microphone not allowed. Open Settings → Apps → Senang Inv → Permissions → enable Microphone.')
        return
      }
    } catch (pluginErr: any) {
      // Plugin unavailable — fall back to getUserMedia
      console.warn('[VoiceCapture] Native plugin failed, trying getUserMedia:', pluginErr?.message)
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        stream.getTracks().forEach(t => t.stop())
      } catch (err: any) {
        if (err?.name === 'NotAllowedError') {
          setSpeechError('Microphone blocked. On Xiaomi: Settings → Apps → Senang Inv → Permissions → enable Microphone AND Record audio.')
        } else {
          setSpeechError(`Mic unavailable: ${err?.message || err?.name || 'unknown'}`)
        }
        return
      }
    }

    setSpeechError(null)
    accumulatedRef.current = []
    setFinalText('')
    setInterimText('')
    setElapsed(0)

    const recognition = new SpeechRecognition()
    recognition.lang = recognitionLangFor(useUiStore.getState().lang)
    recognition.continuous = true
    recognition.interimResults = true

    recognition.onresult = (event: any) => {
      let interim = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          accumulatedRef.current.push(result[0].transcript)
        } else {
          interim += result[0].transcript
        }
      }
      setInterimText(interim)
    }

    recognition.onerror = (event: any) => {
      // Don't stop on 'no-speech' — let user keep talking
      if (event.error === 'no-speech') return
      const messages: Record<string, string> = {
        'not-allowed': 'Microphone not allowed. Check Settings → Apps → Senang Inv → Permissions → Microphone.',
        'audio-capture': 'No microphone found on this device.',
        'network': 'Network error. Check your internet connection.',
        'service-not-allowed': 'Speech recognition not available. Ensure Google app is installed.',
      }
      setSpeechError(messages[event.error] || `Recognition error: ${event.error}`)
      stopRecognition()
    }

    recognition.onend = () => {
      // If timer still running (not user-stopped), restart recognition
      if (timerRef.current) {
        try { recognition.start() } catch {}
      } else {
        setListening(false)
      }
    }

    recognitionRef.current = recognition
    engineRef.current = 'web'
    recognition.start()
    setListening(true)

    // Start timer
    timerRef.current = setInterval(() => {
      setElapsed(prev => prev + 1)
    }, 1000)
  }, [stopRecognition])

  const stop = useCallback(() => {
    stopRecognition()
    const text = accumulatedRef.current.join(' ').trim()
    if (text) {
      setFinalText(text)
      onTranscript(text)
    }
  }, [stopRecognition, onTranscript])

  const handleToggle = () => {
    if (listening) {
      stop()
    } else {
      start()
    }
  }

  // --- icon variant (unchanged, for ChatWindow etc) ---
  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={handleToggle}
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
          <path strokeLinecap="round" strokeLinejoin="round" d={listening
            ? 'M5.25 7.5A2.25 2.25 0 017.5 5.25h9a2.25 2.25 0 012.25 2.25v9a2.25 2.25 0 01-2.25 2.25h-9a2.25 2.25 0 01-2.25-2.25v-9z'
            : 'M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z'
          } />
        </svg>
      </button>
    )
  }

  // --- full variant (WhatsApp-style) ---
  const remaining = MAX_DURATION - elapsed
  const isNearLimit = remaining <= 10

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Circular mic button */}
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        aria-label={listening ? 'Stop recording' : 'Start recording'}
        aria-pressed={listening}
        className={`relative flex items-center justify-center rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 ${
          listening
            ? 'w-20 h-20 bg-red-500 text-white shadow-lg shadow-red-200 scale-110'
            : 'w-18 h-18 bg-teal-600 text-white shadow-md hover:bg-teal-700 active:scale-95'
        }`}
        style={{ width: listening ? '80px' : '72px', height: listening ? '80px' : '72px' }}
      >
        {/* Ripple rings when recording */}
        {listening && (
          <>
            <span className="absolute inset-0 rounded-full bg-red-500/30 animate-ping" style={{ animationDuration: '1.5s' }} />
            <span className="absolute -inset-2 rounded-full border-2 border-red-400/40 animate-pulse" />
          </>
        )}

        <svg className={listening ? 'w-8 h-8' : 'w-7 h-7'} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          {listening ? (
            <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 7.5A2.25 2.25 0 017.5 5.25h9a2.25 2.25 0 012.25 2.25v9a2.25 2.25 0 01-2.25 2.25h-9a2.25 2.25 0 01-2.25-2.25v-9z" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
          )}
        </svg>
      </button>

      {/* Status text */}
      {listening ? (
        <div className="flex flex-col items-center gap-1">
          <span className={`text-sm font-medium tabular-nums ${isNearLimit ? 'text-red-600 animate-pulse' : 'text-teal-700'}`}>
            {formatTime(remaining)} remaining
          </span>
          {interimText && (
            <p className="max-w-xs text-sm text-gray-500 italic truncate">&ldquo;{interimText}&rdquo;</p>
          )}
          {!interimText && (
            <p className="text-sm text-teal-600 animate-pulse">{t('create.listening')}</p>
          )}
        </div>
      ) : (
        <p className="text-sm text-gray-500">{t('create.speakItemsHint')}</p>
      )}

      {/* Error */}
      {speechError && <p role="alert" className="text-sm text-red-600">{speechError}</p>}

      {/* Final transcript after stop */}
      {!listening && finalText && (
        <div role="status" aria-live="polite" className="w-full max-w-sm rounded-lg bg-gray-100 p-3 text-sm text-gray-700 text-center">
          &ldquo;{finalText}&rdquo;
        </div>
      )}
    </div>
  )
}
