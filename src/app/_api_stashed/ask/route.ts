import { NextRequest, NextResponse } from 'next/server'
import { answer, degradedAnswer } from '@/services/ai/askService'
import { isRateLimitError } from '@/services/ai/llmClient'
import type { Lang } from '@/lib/types'

function canUseEnvKeys(): boolean {
  if (!process.env.SENANG_LLM_KEYS) return false
  if (process.env.SENANG_ALLOW_ENV_LLM_KEYS === 'true') return true
  return process.env.NODE_ENV !== 'production'
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { message: string; history: Array<{ id: string; role: 'user'|'assistant'; text: string; lang: Lang; createdAt: string }> }
    const llmKey = req.headers.get('x-llm-key') ?? undefined
    const llmModel = req.headers.get('x-llm-model') ?? undefined
    const llmBaseUrl = req.headers.get('x-llm-base-url') ?? undefined
    const llmProvider = req.headers.get('x-llm-provider') ?? undefined

    // Degraded path - no LLM key anywhere
    if (!llmKey && !canUseEnvKeys()) {
      const result = await answer({ message: body.message, history: body.history ?? [] })
      return NextResponse.json(result)
    }

    if (llmKey) {
      try {
        const result = await answer({ message: body.message, history: body.history ?? [] }, llmKey, llmModel, llmBaseUrl, llmProvider)
        return NextResponse.json(result)
      } catch (err) {
        // 429/402 -> serve non-LLM reply immediately, no retry.
        if (isRateLimitError(err)) {
          console.warn('[/api/ask] Client key rate limited (429/402), serving degraded reply')
          return NextResponse.json(degradedAnswer(body.message))
        }
        console.warn(`[/api/ask] Client key failed: ${(err as Error).message}, falling back to env keys...`)
      }
    }

    if (canUseEnvKeys()) {
      const maxRetries = 6
      let lastError: Error | null = null
      for (let i = 0; i < maxRetries; i++) {
        try {
          const result = await answer({ message: body.message, history: body.history ?? [] })
          return NextResponse.json(result)
        } catch (err) {
          // 429/402 -> stop rotating, serve non-LLM reply immediately.
          if (isRateLimitError(err)) {
            console.warn('[/api/ask] Env key rate limited (429/402), serving degraded reply')
            return NextResponse.json(degradedAnswer(body.message))
          }
          lastError = err as Error
          console.warn(`[/api/ask] Env key ${i + 1}/${maxRetries}: ${lastError.message}`)
        }
      }

      // All env keys exhausted - fall back to degraded
      return NextResponse.json(degradedAnswer(body.message))
    }

    return NextResponse.json(degradedAnswer(body.message))
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Ask error'
    console.error('[/api/ask]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
