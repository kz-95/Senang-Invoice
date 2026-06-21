'use client'
import { useState, useRef, useEffect } from 'react'
import { useAsk } from '@/hooks/useAsk'
import { MessageBubble } from './MessageBubble'
import { SuggestedPrompts } from './SuggestedPrompts'
import { VoiceCapture } from '@/components/capture/VoiceCapture'
import { Button } from '@/components/common/Button'
import { Input } from '@/components/common/Input'
import { Spinner } from '@/components/common/Spinner'
import { useT } from '@/hooks/useT'

export function ChatWindow() {
  const { messages, send, loading } = useAsk()
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const isEmpty = messages.length === 0
  const t = useT()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = () => {
    if (!input.trim() || loading) return
    send(input.trim())
    setInput('')
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pb-4 px-4" role="log" aria-live="polite">
        {isEmpty ? (
          <div role="status" className="flex h-full flex-col items-center justify-center gap-5 px-4 py-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-50 text-teal-700">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 10.5h8M8 14h5m-9 6.5l3.5-2H18a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v14.5z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{t('ask.emptyTitle')}</h3>
              <p className="mx-auto mt-1 max-w-sm text-sm text-gray-500">
                {t('ask.emptyDesc')}
              </p>
            </div>
            <SuggestedPrompts onSelect={send} />
          </div>
        ) : (
          <>
            {messages.map(m => (
              <MessageBubble key={m.id} message={m} />
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-sm border border-gray-200 bg-white px-4 py-3 shadow-sm">
                  <Spinner className="h-4 w-4 text-teal-700" />
                </div>
              </div>
            )}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={e => { e.preventDefault(); handleSend() }}
        className="flex items-center gap-2 border-t border-gray-200 bg-white py-3 px-4"
        style={{ paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))' }}
      >
        <VoiceCapture onTranscript={text => send(text)} variant="icon" disabled={loading} />
        <Input
          placeholder={t('ask.placeholder')}
          value={input}
          onChange={e => setInput(e.target.value)}
          className="h-12 w-full"
          containerClassName="flex-1"
          disabled={loading}
          aria-label="Your question"
        />
        <Button type="submit" aria-label="Send message" loading={loading} disabled={!input.trim()}>
          {t('ask.send')}
        </Button>
      </form>
    </div>
  )
}
