/**
 * LLM Client with key rotation, fallback model, and 429 cooldown.
 * Keys come from SENANG_LLM_KEYS env var (comma-separated).
 * Adapted from gstack/llm-key-system for env-var-only PWA context.
 */

import Anthropic from '@anthropic-ai/sdk'

const PROVIDER_BASE_URL: Record<string, string> = {
  anthropic: 'https://api.anthropic.com',
  openai: 'https://api.openai.com',
  deepseek: 'https://api.deepseek.com',
  ollama: 'http://localhost:11434',
  gemini: 'https://generativelanguage.googleapis.com',
}

// === Types ===

export interface LlmResponse {
  content: Array<{ type: string; text?: string }>
}

/**
 * Thrown when an LLM provider returns 429 (rate limit) or 402 (billing/quota).
 * Routes catch this and fall back to a non-LLM (RAG-only) reply immediately,
 * with no key rotation or retry. See isRateLimitError() for cross-module checks.
 */
export class RateLimitError extends Error {
  readonly isRateLimit = true
  readonly status: number
  constructor(status = 429, message = `LLM rate limited (${status})`) {
    super(message)
    this.name = 'RateLimitError'
    this.status = status
  }
}

/** Robust check that survives across compiled-module boundaries (nodejs/ server). */
export function isRateLimitError(err: unknown): boolean {
  const e = err as { isRateLimit?: boolean; status?: number; message?: string } | null
  if (!e) return false
  return e.isRateLimit === true || e.status === 429 || e.status === 402 || /\b(429|402)\b/.test(e.message || '')
}

export interface LlmClient {
  messages: {
    create(params: {
      model: string
      max_tokens: number
      system: string
      messages: Array<{ role: string; content: unknown }>
    }): Promise<LlmResponse>
  }
}

interface KeyEntry {
  key: string
  provider: 'anthropic' | 'openai' | 'deepseek' | 'gemini' | 'ollama'
}

// === Config from env ===

function parseKeyEntry(raw: string): KeyEntry | null {
  const trimmed = raw.trim()
  if (!trimmed) return null

  const colonIdx = trimmed.indexOf(':')
  if (colonIdx !== -1) {
    const prefix = trimmed.slice(0, colonIdx).toLowerCase()
    const key = trimmed.slice(colonIdx + 1).trim()
    if (!key) return null
    const known = ['anthropic', 'openai', 'deepseek', 'gemini', 'ollama', 'claude']
    if (known.includes(prefix)) {
      const provider = prefix === 'claude' ? 'anthropic' : prefix as KeyEntry['provider']
      return { key, provider }
    }
  }

  return { key: trimmed, provider: detectProvider(trimmed) }
}

function getApiKeys(): KeyEntry[] {
  const raw = process.env.SENANG_LLM_KEYS || process.env.ANTHROPIC_API_KEY || ''
  return raw.split(',').map(parseKeyEntry).filter((e): e is KeyEntry => e !== null)
}

function getPrimaryModel(): string {
  return process.env.SENANG_LLM_MODEL || 'claude-opus-4-8'
}

function getFallbackModel(): string {
  return process.env.SENANG_LLM_FALLBACK || 'claude-haiku-4-5-20251001'
}

function detectProvider(key: string, explicitProvider?: string): 'anthropic' | 'openai' | 'deepseek' | 'gemini' | 'ollama' {
  if (explicitProvider) {
    if (explicitProvider === 'anthropic' || explicitProvider === 'claude') return 'anthropic'
    if (explicitProvider === 'gemini') return 'gemini'
    if (explicitProvider === 'deepseek') return 'deepseek'
    if (explicitProvider === 'ollama') return 'ollama'
    return 'openai'
  }
  if (key.startsWith('sk-ant-')) return 'anthropic'
  if (key.startsWith('sk-')) {
    const explicit = (process.env.SENANG_LLM_PROVIDER || '').toLowerCase()
    if (explicit === 'deepseek') return 'deepseek'
    return 'openai'
  }
  if (key.startsWith('AIza') || key.startsWith('AQ') || key.startsWith('AI')) return 'gemini'
  return 'openai'
}

/** Test-only re-export of the internal provider sniffer. */
export function detectProviderForTest(key: string) {
  return detectProvider(key)
}

// === Key rotation ===

let _keyIndex = 0
let _currentModel = getPrimaryModel()
let _fallbackActive = false

function getCurrentKey(): KeyEntry | null {
  const keys = getApiKeys()
  if (keys.length === 0) return null
  return keys[_keyIndex % keys.length]
}

function rotateKey(): boolean {
  const keys = getApiKeys()
  if (keys.length === 0) return false
  _keyIndex = (_keyIndex + 1) % keys.length
  if (_keyIndex === 0) {
    if (!_fallbackActive) {
      _fallbackActive = true
      _currentModel = getFallbackModel()
      console.warn('[LLM] All keys failed with primary model - switching to fallback:', _currentModel)
    } else {
      _fallbackActive = false
      _currentModel = getPrimaryModel()
      console.warn('[LLM] All keys exhausted - resetting chain')
    }
  }
  return true
}

function getCurrentModel(): string {
  return _currentModel
}

// === 429 cooldown ===

const _cooldownUntil = new Map<string, number>()
const COOLDOWN_MS = 60_000

function isCoolingDown(key: string): boolean {
  const until = _cooldownUntil.get(key)
  return until != null && until >= Date.now()
}

function markCoolingDown(key: string): void {
  _cooldownUntil.set(key, Date.now() + COOLDOWN_MS)
}

// === Client factory ===

export function getLlamaClient(overrideKey?: string, overrideModel?: string, overrideBaseUrl?: string, overrideProvider?: string): LlmClient | null {
  if (overrideKey) {
    const provider = overrideProvider || detectProvider(overrideKey) || 'openai'
    const model = overrideModel || '-'
    const url = provider === 'gemini' ? 'https://generativelanguage.googleapis.com/v1beta' : (overrideBaseUrl || PROVIDER_BASE_URL[provider] || PROVIDER_BASE_URL.openai)
    console.log(`[LLM] 🗝️ BYO client key | provider=${provider} model=${model} base=${url}`)
    if (provider === 'anthropic' || provider === 'claude') {
      return createAnthropicClient(overrideKey)
    }
    if (provider === 'gemini') {
      return createGeminiClient(overrideKey)
    }
    return createOpenAiClient(overrideKey, url)
  }

  const entry = getCurrentKey()
  if (!entry) {
    console.warn('[LLM] ❌ No env keys configured — degraded RAG-only replies')
    return null
  }

  if (isCoolingDown(entry.key)) {
    console.log(`[LLM] ⏳ Key cooling down — rotating to next...`)
    rotateKey()
    return getLlamaClient()
  }

  const idx = (_keyIndex % getApiKeys().length) + 1
  const total = getApiKeys().length
  const model = getCurrentModel()
  const url = entry.provider === 'gemini' ? 'https://generativelanguage.googleapis.com/v1beta' : (PROVIDER_BASE_URL[entry.provider] || PROVIDER_BASE_URL.openai)
  console.log(`[LLM] 🔑 Env key #${idx}/${total} | provider=${entry.provider} model=${model} base=${url}`)

  if (entry.provider === 'anthropic') {
    return createAnthropicClient(entry.key)
  }
  if (entry.provider === 'gemini') {
    return createGeminiClient(entry.key)
  }

  return createOpenAiClient(entry.key, url)
}

function createAnthropicClient(apiKey: string): LlmClient {
  const anthropic = new Anthropic({ apiKey })
  return {
    messages: {
      async create(params) {
        try {
          return await (anthropic.messages as any).create(params)
        } catch (err) {
          const status = (err as { status?: number })?.status
          if (status === 429 || status === 402) throw new RateLimitError(status)
          markCoolingDown(apiKey)
          rotateKey()
          throw err
        }
      },
    },
  }
}

function createGeminiClient(apiKey: string): LlmClient {
  return {
    messages: {
      async create(params) {
        try {
          return await callGemini(apiKey, params.model, params.system, params.messages, params.max_tokens)
        } catch (err) {
          if (isRateLimitError(err)) throw err
          markCoolingDown(apiKey)
          rotateKey()
          throw err
        }
      },
    },
  }
}

// Convert Anthropic-style message content (string | text/image blocks) into
// Gemini `parts`. Images must become inlineData blobs, not stringified JSON,
// or vision extraction silently returns nothing.
function toGeminiParts(content: unknown): Array<Record<string, unknown>> {
  if (typeof content === 'string') return [{ text: content }]
  if (Array.isArray(content)) {
    return (content as Array<Record<string, unknown>>).map(block => {
      if (block.type === 'image' && block.source) {
        const source = block.source as { data: string; media_type?: string }
        return { inlineData: { mimeType: source.media_type || 'image/jpeg', data: source.data } }
      }
      if (block.type === 'text') return { text: (block.text as string) ?? '' }
      return { text: JSON.stringify(block) }
    })
  }
  return [{ text: JSON.stringify(content) }]
}

async function callGemini(apiKey: string, model: string, systemPrompt: string, messages: Array<{ role: string; content: unknown }>, maxTokens = 1024): Promise<LlmResponse> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`

  const userMessages = messages
    .filter(m => m.role === 'user' || m.role === 'assistant')
    .map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: toGeminiParts(m.content),
    }))

  const body: Record<string, unknown> = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents: userMessages,
    generationConfig: { maxOutputTokens: maxTokens },
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    if (res.status === 429 || res.status === 402) throw new RateLimitError(res.status)
    const errText = await res.text()
    throw new Error(`Gemini ${res.status}: ${errText.slice(0, 200)}`)
  }

  const json = await res.json() as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
  }

  const text = json.candidates?.[0]?.content?.parts?.map(p => p.text ?? '').join('') ?? ''
  return { content: [{ type: 'text', text }] }
}

function createOpenAiClient(apiKey: string, customBaseUrl?: string): LlmClient {
  const baseUrl = (customBaseUrl || process.env.SENANG_LLM_BASE_URL || 'https://api.openai.com').replace(/\/+$/, '')

  return {
    messages: {
      async create(params) {
        try {
          const systemMsg = { role: 'system', content: params.system }

          const openAiMessages = params.messages.map(m => {
            let content = m.content
            if (Array.isArray(content)) {
              content = (content as Array<Record<string, unknown>>).map(block => {
                if (block.type === 'image') {
                  const source = block.source as { data: string; media_type: string }
                  return {
                    type: 'image_url',
                    image_url: { url: `data:${source.media_type};base64,${source.data}` }
                  }
                }
                return block
              })
            }
            return { role: m.role as 'user' | 'assistant', content }
          })

          const body = {
            model: params.model,
            max_tokens: params.max_tokens,
            messages: [systemMsg, ...openAiMessages],
          }

          const res = await fetch(`${baseUrl}/v1/chat/completions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify(body),
          })

          if (res.status === 429 || res.status === 402) {
            throw new RateLimitError(res.status)
          }

          if (!res.ok) {
            const errText = await res.text()
            markCoolingDown(apiKey)
            rotateKey()
            throw new Error(`LLM error (${res.status}): ${errText.slice(0, 200)}`)
          }

          const json = await res.json() as {
            choices: Array<{ message: { content: string } }>
          }

          const text = json.choices?.[0]?.message?.content ?? ''
          return { content: [{ type: 'text', text }] }
        } catch (err) {
          if (isRateLimitError(err)) throw err
          const msg = (err as Error).message
          if (msg.includes('LLM ')) throw err
          markCoolingDown(apiKey)
          rotateKey()
          throw err
        }
      },
    },
  }
}

// === Retry loop with key rotation ===

export async function callWithRetry(
  fn: (client: NonNullable<ReturnType<typeof getLlamaClient>>, model: string) => Promise<LlmResponse>,
  maxRetries = 6
): Promise<LlmResponse> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const client = getLlamaClient()
    if (!client) throw new Error('No LLM API keys configured')

    const model = getCurrentModel()

    try {
      return await fn(client, model)
    } catch (err) {
      lastError = err as Error
    }
  }

  throw lastError ?? new Error('All LLM keys exhausted')
}

// === Convenience exports for specific services ===

export function getModel(overrideModel?: string): string {
  return overrideModel ?? getCurrentModel()
}

// === Task-scoped client selection (vision vs text) ===

export const TEXT_MODEL = 'deepseek-v4-flash'
export const VISION_MODEL = 'gemini-2.5-flash'

/** First env key matching the given provider, or null. */
export function getEnvKeyFor(provider: KeyEntry['provider']): KeyEntry | null {
  return getApiKeys().find(e => e.provider === provider) ?? null
}

/** Client for image/vision tasks — Gemini. Null if no gemini key configured. */
export function getVisionClient(): LlmClient | null {
  const entry = getEnvKeyFor('gemini')
  if (!entry) return null
  return getLlamaClient(entry.key, VISION_MODEL, undefined, 'gemini')
}

/** Client for text tasks — DeepSeek. Null if no deepseek key configured. */
export function getTextClient(): LlmClient | null {
  const entry = getEnvKeyFor('deepseek')
  if (!entry) return null
  return getLlamaClient(entry.key, TEXT_MODEL, PROVIDER_BASE_URL.deepseek, 'deepseek')
}

/** Test-only re-export. */
export function getEnvKeyForTest(provider: KeyEntry['provider']): KeyEntry | null {
  return getEnvKeyFor(provider)
}
