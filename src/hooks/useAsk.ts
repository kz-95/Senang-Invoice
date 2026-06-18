'use client'
import { useCallback, useState } from 'react'
import { useAskStore } from '@/stores/askStore'
import { llmKeyRepository } from '@/services/data/llmKeyRepository'
import type { AskMessage, Lang } from '@/lib/types'
import { apiBase } from '@/lib/apiBase'

export function useAsk() {
  const [loading, setLoading] = useState(false)
  const messages = useAskStore((s) => s.messages)
  const addMessage = useAskStore((s) => s.addMessage)

  const send = useCallback(async (text: string) => {
    const userMsg: AskMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      text,
      lang: 'en',
      createdAt: new Date().toISOString(),
    }
    addMessage(userMsg)
    setLoading(true)

    try {
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
        id: crypto.randomUUID(),
        role: 'assistant',
        text: data.text,
        lang: data.lang,
        createdAt: new Date().toISOString(),
      }
      addMessage(assistantMsg)
    } catch {
      const errMsg: AskMessage = {
        id: crypto.randomUUID(),
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
