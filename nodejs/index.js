// On-device Node HTTP server. Re-hosts the Next /api/* logic by importing the
// framework-agnostic services compiled to ./services (see scripts/build-node.mjs).
// The WebView flips its fetch base to http://127.0.0.1:3001 when native (apiBase()).

// Resolve the "@/*" alias used in compiled service requires. The compiled tree
// mirrors src/ under ./services, so "@" -> "./services" (driven by package.json
// "_moduleAliases"). Falls back to a manual register if the package isn't present.
try {
  require('module-alias/register')
} catch {
  try {
    require('module-alias').addAlias('@', require('node:path').join(__dirname, 'services'))
  } catch {
    /* aliases only needed by the extract/ask chains; submit works without */
  }
}

// Load baked env keys from env-keys.js (primary) or .env.json (fallback).
// Written by build-node.mjs during APK build. Both contain the same keys
// from .env.local, baked into the APK so the Node.js server has API keys
// on-device. Falls back to process.env for non-APK dev.
const { existsSync: _exists, readFileSync: _readFile } = require('node:fs')
const { join: _join } = require('node:path')

let _baked = null
// Primary: CommonJS module (capacitor-nodejs may strip .json files)
const _jsPath = _join(__dirname, 'env-keys.js')
if (_exists(_jsPath)) {
  try {
    _baked = require(_jsPath)
    console.log('[senanginvoice-node] loaded baked keys from env-keys.js:', Object.keys(_baked).join(', '))
  } catch (e) {
    console.warn('[senanginvoice-node] failed to require env-keys.js:', e.message)
  }
}
// Fallback: JSON file
if (!_baked) {
  const _jsonPath = _join(__dirname, '.env.json')
  if (_exists(_jsonPath)) {
    try {
      _baked = JSON.parse(_readFile(_jsonPath, 'utf8'))
      console.log('[senanginvoice-node] loaded baked keys from .env.json:', Object.keys(_baked).join(', '))
    } catch (e) {
      console.warn('[senanginvoice-node] failed to load .env.json:', e.message)
    }
  }
}
if (_baked) {
  for (const [k, v] of Object.entries(_baked)) {
    if (!process.env[k]) process.env[k] = v
  }
  console.log('[senanginvoice-node] LLM keys active:', !!process.env.SENANG_LLM_KEYS)
} else {
  console.log('[senanginvoice-node] no baked keys — using process.env (dev mode)')
}

const http = require('http')

const PORT = 3001

function readBody(req) {
  return new Promise((resolve) => {
    let data = ''
    req.on('data', (chunk) => { data += chunk })
    req.on('end', () => resolve(data))
  })
}

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-myinvois-client-id, x-myinvois-client-secret, x-myinvois-api-base, x-llm-key, x-llm-model, x-llm-base-url, x-llm-provider')
  res.setHeader('Content-Type', 'application/json')
}

function json(res, code, obj) {
  res.writeHead(code)
  res.end(JSON.stringify(obj))
}

function canUseEnvKeys() {
  if (!process.env.SENANG_LLM_KEYS) return false
  if (process.env.SENANG_ALLOW_ENV_LLM_KEYS === 'true') return true
  return process.env.NODE_ENV !== 'production'
}

// 429/402 from any provider -> serve non-LLM reply immediately (no retry).
function isRateLimit(err) {
  if (!err) return false
  return err.isRateLimit === true || err.status === 429 || err.status === 402
    || /\b(429|402)\b/.test(err.message || '')
}

// --- service handlers (lazy-required so a load failure in one doesn't kill all) ---

async function handleSubmit(req, res) {
  const { submitInvoice } = require('./services/services/invoice/submissionService')
  const body = JSON.parse((await readBody(req)) || '{}')
  const clientId = req.headers['x-myinvois-client-id'] || ''
  const clientSecret = req.headers['x-myinvois-client-secret'] || ''
  const creds = clientId && clientSecret ? {
    clientId,
    clientSecret,
    apiBase: req.headers['x-myinvois-api-base'] || 'https://preprod-api.myinvois.hasil.gov.my',
    portalBase: 'https://preprod.myinvois.hasil.gov.my',
  } : undefined
  const mode = creds ? 'sandbox' : 'mock'
  const result = await submitInvoice(body.ubl, body.codeNumber || `INV-${Date.now()}`, { mode, creds })
  return json(res, 200, result)
}

async function handleExtract(req, res) {
  const { extractLineItems } = require('./services/services/ai/extractionService')
  const { mapFields } = require('./services/services/ai/mappingService')
  const { getLlamaClient } = require('./services/services/ai/llmClient')
  const body = JSON.parse((await readBody(req)) || '{}')
  const key = req.headers['x-llm-key'] || undefined
  const model = req.headers['x-llm-model'] || undefined
  const baseUrl = req.headers['x-llm-base-url'] || undefined
  const provider = req.headers['x-llm-provider'] || undefined

  const extractAndMap = async (k, m, b, p) => {
    const items = await extractLineItems(
      { imageBase64: body.imageBase64, transcript: body.transcript }, k, m, b, p
    )
    try {
      const client = (k ? getLlamaClient(k, m, b, p) : getLlamaClient()) || undefined
      return await mapFields(items, client)
    } catch (mapErr) {
      console.warn('[/api/extract] mapFields failed:', mapErr.message)
      return items.map((it) => ({
        ...it,
        classificationCode: it.classificationCode || '045',
        uom: it.uom || 'C62',
        confidence: 0,
      }))
    }
  }

  const degradedExtract = () => {
    const rawText = body.transcript || (body.imageBase64 ? '[Image received - OCR text not available without AI key]' : '')
    return json(res, 200, { items: [], degraded: true, rawText })
  }

  if (key) {
    try {
      return json(res, 200, { items: await extractAndMap(key, model, baseUrl, provider) })
    } catch (err) {
      if (isRateLimit(err)) {
        console.warn('[/api/extract] client key rate limited (429/402), serving degraded result')
        return degradedExtract()
      }
      console.warn('[/api/extract] client key failed:', err.message)
    }
  }

  if (canUseEnvKeys()) {
    for (let i = 0; i < 6; i++) {
      try {
        return json(res, 200, { items: await extractAndMap() })
      } catch (err) {
        if (isRateLimit(err)) {
          console.warn('[/api/extract] env key rate limited (429/402), serving degraded result')
          return degradedExtract()
        }
        console.warn(`[/api/extract] env key ${i + 1}/6:`, err.message)
      }
    }
    return degradedExtract()
  }

  // Degraded - no key anywhere
  return degradedExtract()
}

async function handleAsk(req, res) {
  const { answer, degradedAnswer } = require('./services/services/ai/askService')
  const body = JSON.parse((await readBody(req)) || '{}')
  const message = body.message
  const history = body.history || []
  const key = req.headers['x-llm-key'] || undefined
  const model = req.headers['x-llm-model'] || undefined
  const baseUrl = req.headers['x-llm-base-url'] || undefined
  const provider = req.headers['x-llm-provider'] || undefined

  if (!key && !canUseEnvKeys()) {
    return json(res, 200, degradedAnswer(message))
  }

  if (key) {
    try {
      return json(res, 200, await answer({ message, history }, key, model, baseUrl, provider))
    } catch (err) {
      if (isRateLimit(err)) {
        console.warn('[/api/ask] client key rate limited (429/402), serving degraded reply')
        return json(res, 200, degradedAnswer(message))
      }
      console.warn('[/api/ask] client key failed:', err.message)
    }
  }

  if (canUseEnvKeys()) {
    for (let i = 0; i < 6; i++) {
      try {
        return json(res, 200, await answer({ message, history }))
      } catch (err) {
        if (isRateLimit(err)) {
          console.warn('[/api/ask] env key rate limited (429/402), serving degraded reply')
          return json(res, 200, degradedAnswer(message))
        }
        console.warn(`[/api/ask] env key ${i + 1}/6:`, err.message)
      }
    }
    // env keys exhausted - degraded fallback
    return json(res, 200, degradedAnswer(message))
  }

  return json(res, 200, degradedAnswer(message))
}

async function handleLlmModels(req, res) {
  const { getLlamaClient } = require('./services/services/ai/llmClient')
  const body = JSON.parse((await readBody(req)) || '{}')
  const provider = body.provider
  const apiKey = body.apiKey || req.headers['x-llm-key']
  const baseUrl = body.baseUrl || req.headers['x-llm-base-url']

  const DEFAULT_MODELS = {
    anthropic: ['claude-opus-4-8', 'claude-sonnet-4-6', 'claude-haiku-4-5-20251001', 'claude-3-5-sonnet-20241022'],
    openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'o3-mini'],
    deepseek: ['deepseek-chat', 'deepseek-reasoner'],
    ollama: ['llama3.2', 'mistral', 'gemma3', 'qwen2.5', 'deepseek-r1'],
  }

  if (provider === 'ollama') {
    try {
      const url = (baseUrl || 'http://localhost:11434').replace(/\/+$/, '')
      const fetchRes = await fetch(`${url}/api/tags`, { signal: AbortSignal.timeout(5000) })
      if (fetchRes.ok) {
        const data = await fetchRes.json()
        const models = (data.models ?? []).map((m) => m.name).sort()
        if (models.length > 0) return json(res, 200, { models })
      }
    } catch { /* fall through to defaults */ }
    return json(res, 200, { models: DEFAULT_MODELS.ollama })
  }

  if (provider === 'anthropic' && apiKey) {
    try {
      const fetchRes = await fetch('https://api.anthropic.com/v1/models', {
        headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
        signal: AbortSignal.timeout(5000),
      })
      if (fetchRes.ok) {
        const data = await fetchRes.json()
        const models = (data.data ?? []).map((m) => m.id).sort()
        if (models.length > 0) return json(res, 200, { models })
      }
    } catch { /* fall through */ }
    return json(res, 200, { models: DEFAULT_MODELS.anthropic })
  }

  if (apiKey) {
    try {
      const url = (baseUrl || 'https://api.openai.com').replace(/\/+$/, '')
      const fetchRes = await fetch(`${url}/v1/models`, {
        headers: { Authorization: `Bearer ${apiKey}` },
        signal: AbortSignal.timeout(5000),
      })
      if (fetchRes.ok) {
        const data = await fetchRes.json()
        const models = (data.data ?? []).map((m) => m.id).sort().slice(0, 30)
        if (models.length > 0) return json(res, 200, { models })
      }
    } catch { /* fall through */ }
  }

  return json(res, 200, { models: DEFAULT_MODELS[provider] || [] })
}

function handleSeedKeys(req, res) {
  function seedingAllowed() {
    if (process.env.SENANG_ALLOW_KEY_SEED === 'true') return true
    return process.env.NODE_ENV !== 'production'
  }

  if (!seedingAllowed()) return json(res, 403, { keys: [] })

  const raw = process.env.SENANG_LLM_KEYS ?? ''
  const keys = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((entry) => {
      const idx = entry.indexOf(':')
      if (idx === -1) return null
      return { provider: entry.slice(0, idx).toLowerCase(), apiKey: entry.slice(idx + 1).trim() }
    })
    .filter((k) => k !== null && k.apiKey.length > 0)

  return json(res, 200, { keys })
}

async function handleOcr(req, res) {
  const body = JSON.parse((await readBody(req)) || '{}')
  if (!body.image) return json(res, 400, { error: 'missing image field' })

  const OCR_URL = process.env.OCR_SERVER_URL || 'http://localhost:8502/ocr'
  try {
    const fetchRes = await fetch(OCR_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: body.image }),
    })
    if (!fetchRes.ok) {
      const err = await fetchRes.text()
      return json(res, 502, { error: `OCR server: ${err.slice(0, 200)}` })
    }
    const data = await fetchRes.json()
    return json(res, 200, data)
  } catch (err) {
    return json(res, 500, { error: err instanceof Error ? err.message : 'OCR failed' })
  }
}

const POST_ROUTES = {
  '/api/submit': handleSubmit,
  '/api/extract': handleExtract,
  '/api/ask': handleAsk,
  '/api/llm/models': handleLlmModels,
  '/api/ocr': handleOcr,
}

const GET_ROUTES = {
  '/api/seed-keys': handleSeedKeys,
}

http.createServer(async (req, res) => {
  setCors(res)
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end() }

  const url = new URL(req.url, `http://127.0.0.1:${PORT}`)

  try {
    if (url.pathname === '/health') return json(res, 200, { ok: true })

    if (req.method === 'POST') {
      const handler = POST_ROUTES[url.pathname]
      if (handler) return await handler(req, res)
    }

    if (req.method === 'GET') {
      const handler = GET_ROUTES[url.pathname]
      if (handler) return handler(req, res)
    }

    return json(res, 404, { error: 'Not found' })
  } catch (err) {
    console.error('[nodejs]', err && err.message)
    return json(res, 500, { error: err instanceof Error ? err.message : 'server error' })
  }
}).listen(PORT, '127.0.0.1', () => {
  console.log(`[senanginvoice-node] listening on http://127.0.0.1:${PORT}`)
})
