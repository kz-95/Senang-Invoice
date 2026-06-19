import { NextRequest, NextResponse } from 'next/server'
import { answer } from '@/services/ai/askService'
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

    // Degraded path — no LLM key anywhere
    if (!llmKey && !canUseEnvKeys()) {
      const result = await answer({ message: body.message, history: body.history ?? [] })
      return NextResponse.json(result)
    }

    if (llmKey) {
      try {
        const result = await answer({ message: body.message, history: body.history ?? [] }, llmKey, llmModel, llmBaseUrl, llmProvider)
        return NextResponse.json(result)
      } catch (err) {
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
          lastError = err as Error
          console.warn(`[/api/ask] Env key ${i + 1}/${maxRetries}: ${lastError.message}`)
        }
      }

      // All env keys exhausted — fall back to degraded
      const result = await answer({ message: body.message, history: body.history ?? [] })
      return NextResponse.json(result)
    }

    throw new Error('All LLM keys exhausted - no fallback available')
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Ask error'
    console.error('[/api/ask]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
