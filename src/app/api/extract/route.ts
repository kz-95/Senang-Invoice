import { NextRequest, NextResponse } from 'next/server'
import { extractLineItems } from '@/services/ai/extractionService'
import { mapFields } from '@/services/ai/mappingService'
import { getLlamaClient } from '@/services/ai/llmClient'

function canUseEnvKeys(): boolean {
  if (!process.env.SENANG_LLM_KEYS) return false
  if (process.env.SENANG_ALLOW_ENV_LLM_KEYS === 'true') return true
  return process.env.NODE_ENV !== 'production'
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { imageBase64?: string; transcript?: string }
    const llmKey = req.headers.get('x-llm-key') ?? undefined
    const llmModel = req.headers.get('x-llm-model') ?? undefined
    const llmBaseUrl = req.headers.get('x-llm-base-url') ?? undefined
    const llmProvider = req.headers.get('x-llm-provider') ?? undefined

    const extractAndMap = async (
      key?: string, model?: string, baseUrl?: string, provider?: string
    ): Promise<ReturnType<typeof extractLineItems>> => {
      const items = await extractLineItems(
        { imageBase64: body.imageBase64, transcript: body.transcript },
        key, model, baseUrl, provider
      )

      try {
        const client = (key ? getLlamaClient(key, model, baseUrl, provider) : getLlamaClient()) ?? undefined
        const mapped = await mapFields(items, client)
        return mapped
      } catch (mapErr) {
        console.warn(`[/api/extract] mapFields failed: ${(mapErr as Error).message}, falling back to uncategorized items`)
        return items.map(it => ({
          ...it,
          classificationCode: it.classificationCode || '045',
          uom: it.uom || 'C62',
          confidence: 0,
        }))
      }
    }

    if (llmKey) {
      try {
        const items = await extractAndMap(llmKey, llmModel, llmBaseUrl, llmProvider)
        return NextResponse.json({ items })
      } catch (err) {
        console.warn(`[/api/extract] Client key failed: ${(err as Error).message}, falling back to env keys...`)
      }
    }

    if (canUseEnvKeys()) {
      const maxRetries = 6
      let lastError: Error | null = null
      for (let i = 0; i < maxRetries; i++) {
        try {
          const items = await extractAndMap()
          return NextResponse.json({ items })
        } catch (err) {
          lastError = err as Error
          console.warn(`[/api/extract] Env key ${i + 1}/${maxRetries}: ${lastError.message}`)
        }
      }
      throw lastError ?? new Error('All LLM keys exhausted')
    }

    // Degraded path - no LLM key anywhere, return fallback items
    if (body.transcript || body.imageBase64) {
      // We have raw input but can't AI-extract - return raw text hint
      const rawText = body.transcript || (body.imageBase64 ? '[Image received - OCR text not available without AI key]' : '')
      return NextResponse.json({
        items: [],
        degraded: true,
        rawText,
      })
    }

    return NextResponse.json({ items: [], degraded: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Extraction failed'
    console.error('[/api/extract]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
