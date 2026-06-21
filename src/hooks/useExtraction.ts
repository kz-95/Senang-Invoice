'use client'
import { useCallback, useState } from 'react'
import { useInvoiceStore } from '@/stores/invoiceStore'
import { llmKeyRepository } from '@/services/data/llmKeyRepository'
import { apiBase } from '@/lib/apiBase'

export function useExtraction() {
  const [loading, setLoading] = useState(false)
  const [ocrProgress, setOcrProgress] = useState('')
  const [error, setError] = useState<string | null>(null)
  const addLine = useInvoiceStore((s) => s.addLine)

  const extract = useCallback(async (input: { imageBase64?: string; transcript?: string }) => {
    setLoading(true)
    setError(null)
    setOcrProgress('')
    try {
      if (input.imageBase64) {
        setOcrProgress('Scanning receipt...')
      }

      const llmKey = await llmKeyRepository.getPrimaryKey()
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      const activeKey = llmKey ?? {
        provider: 'anthropic',
        apiKey: process.env.NEXT_PUBLIC_LLM_FALLBACK_KEY ?? '',
        model: 'claude-sonnet-4-20250514',
      }
      headers['x-llm-key'] = activeKey.apiKey
      headers['x-llm-model'] = activeKey.model
      headers['x-llm-provider'] = activeKey.provider
      if (llmKey?.baseUrl) {
        headers['x-llm-base-url'] = llmKey.baseUrl
      }

      const res = await fetch(`${apiBase()}/api/extract`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ imageBase64: input.imageBase64, transcript: input.transcript }),
      })
      if (!res.ok) throw new Error('Extraction failed')
      const data = await res.json() as { items: Array<{ description: string; qty: number; unitPrice: number; uom: string; classificationCode: string; taxType: string; taxAmount: number }> }

      for (const item of data.items) {
        addLine(item)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Scan failed')
    } finally {
      setLoading(false)
      setOcrProgress('')
    }
  }, [addLine])

  return { extract, loading, ocrProgress, error }
}
