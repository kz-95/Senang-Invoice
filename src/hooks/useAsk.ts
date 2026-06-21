'use client'
import { useCallback, useState } from 'react'
import { useAskStore } from '@/stores/askStore'
import { llmKeyRepository } from '@/services/data/llmKeyRepository'
import type { AskMessage, Lang } from '@/lib/types'
import { safeRandomUUID } from '@/lib/crypto'
import { apiBase } from '@/lib/apiBase'

export function useAsk() {
  const [loading, setLoading] = useState(false)
  const messages = useAskStore((s) => s.messages)
  const addMessage = useAskStore((s) => s.addMessage)

  const send = useCallback(async (text: string) => {
    const userMsg: AskMessage = {
      id: safeRandomUUID(),
      role: 'user',
      text,
      lang: 'en',
      createdAt: new Date().toISOString(),
    }
    addMessage(userMsg)
    setLoading(true)

    try {
      // BYO key only: send the user's own key if they set one in Settings.
      // Otherwise send NO key headers — the server route uses its server-side
      // env keys (deepseek for text, gemini for vision). Never ship a secret
      // into the browser bundle (no NEXT_PUBLIC_* keys).
      const llmKey = await llmKeyRepository.getPrimaryKey()
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (llmKey) {
        headers['x-llm-key'] = llmKey.apiKey
        headers['x-llm-model'] = llmKey.model
        headers['x-llm-provider'] = llmKey.provider
        if (llmKey.baseUrl) {
          headers['x-llm-base-url'] = llmKey.baseUrl
        }
      }

      const res = await fetch(`${apiBase()}/api/ask`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ message: text, history: messages }),
      })
      if (!res.ok) throw new Error('Ask request failed')
      const data = await res.json() as { text: string; lang: Lang }

      const assistantMsg: AskMessage = {
        id: safeRandomUUID(),
        role: 'assistant',
        text: data.text,
        lang: data.lang,
        createdAt: new Date().toISOString(),
      }
      addMessage(assistantMsg)
    } catch {
      const errMsg: AskMessage = {
        id: safeRandomUUID(),
        role: 'assistant',
        text: 'Sorry, something went wrong. Please try again.',
        lang: 'en',
        createdAt: new Date().toISOString(),
      }
      addMessage(errMsg)
    } finally {
      setLoading(false)
    }
  }, [messages, addMessage])

  return { messages, send, loading }
}
