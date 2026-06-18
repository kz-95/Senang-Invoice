import { NextRequest, NextResponse } from 'next/server'

const DEFAULT_MODELS: Record<string, string[]> = {
  anthropic: ['claude-opus-4-8', 'claude-sonnet-4-6', 'claude-haiku-4-5-20251001', 'claude-3-5-sonnet-20241022'],
  openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'o3-mini'],
  deepseek: ['deepseek-chat', 'deepseek-reasoner'],
  ollama: ['llama3.2', 'mistral', 'gemma3', 'qwen2.5', 'deepseek-r1'],
}

export async function POST(req: NextRequest) {
  try {
    const { provider, apiKey, baseUrl } = await req.json() as { provider: string; apiKey?: string; baseUrl?: string }

    if (provider === 'ollama') {
      try {
        const url = (baseUrl || 'http://localhost:11434').replace(/\/+$/, '')
        const res = await fetch(`${url}/api/tags`, { signal: AbortSignal.timeout(5000) })
        if (res.ok) {
          const data = await res.json() as { models?: Array<{ name: string }> }
          const models = (data.models ?? []).map((m: { name: string }) => m.name).sort()
          if (models.length > 0) return NextResponse.json({ models })
        }
      } catch { /* fall through to defaults */ }
      return NextResponse.json({ models: DEFAULT_MODELS.ollama })
    }

    if (provider === 'anthropic' && apiKey) {
      try {
        const res = await fetch('https://api.anthropic.com/v1/models', {
          headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
          signal: AbortSignal.timeout(5000),
        })
        if (res.ok) {
          const data = await res.json() as { data?: Array<{ id: string }> }
          const models = (data.data ?? []).map(m => m.id).sort()
          if (models.length > 0) return NextResponse.json({ models })
        }
      } catch { /* fall through */ }
      return NextResponse.json({ models: DEFAULT_MODELS.anthropic })
    }

    if (apiKey) {
      try {
        const url = (baseUrl || 'https://api.openai.com').replace(/\/+$/, '')
        const res = await fetch(`${url}/v1/models`, {
          headers: { Authorization: `Bearer ${apiKey}` },
          signal: AbortSignal.timeout(5000),
        })
        if (res.ok) {
          const data = await res.json() as { data?: Array<{ id: string }> }
          const models = (data.data ?? []).map((m: { id: string }) => m.id).sort().slice(0, 30)
          if (models.length > 0) return NextResponse.json({ models })
        }
      } catch { /* fall through */ }
    }

    return NextResponse.json({ models: DEFAULT_MODELS[provider] || [] })
  } catch {
    return NextResponse.json({ models: [] }, { status: 500 })
  }
}
