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

  if (key) {
    try {
      return json(res, 200, { items: await extractAndMap(key, model, baseUrl, provider) })
    } catch (err) {
      console.warn('[/api/extract] client key failed:', err.message)
    }
  }

  if (canUseEnvKeys()) {
    let lastError = null
    for (let i = 0; i < 6; i++) {
      try {
        return json(res, 200, { items: await extractAndMap() })
      } catch (err) {
        lastError = err
        console.warn(`[/api/extract] env key ${i + 1}/6:`, err.message)
      }
    }
    throw lastError || new Error('All LLM keys exhausted')
  }

  // Degraded - no key anywhere
  if (body.transcript || body.imageBase64) {
    const rawText = body.transcript || (body.imageBase64 ? '[Image received - OCR text not available without AI key]' : '')
    return json(res, 200, { items: [], degraded: true, rawText })
  }
  return json(res, 200, { items: [], degraded: true })
}

async function handleAsk(req, res) {
  const { answer } = require('./services/services/ai/askService')
  const body = JSON.parse((await readBody(req)) || '{}')
  const message = body.message
  const history = body.history || []
  const key = req.headers['x-llm-key'] || undefined
  const model = req.headers['x-llm-model'] || undefined
  const baseUrl = req.headers['x-llm-base-url'] || undefined
  const provider = req.headers['x-llm-provider'] || undefined

  if (!key && !canUseEnvKeys()) {
    return json(res, 200, await answer({ message, history }))
  }

  if (key) {
    try {
      return json(res, 200, await answer({ message, history }, key, model, baseUrl, provider))
    } catch (err) {
      console.warn('[/api/ask] client key failed:', err.message)
    }
  }

  if (canUseEnvKeys()) {
    for (let i = 0; i < 6; i++) {
      try {
        return json(res, 200, await answer({ message, history }))
      } catch (err) {
        console.warn(`[/api/ask] env key ${i + 1}/6:`, err.message)
      }
    }
    // env keys exhausted - degraded fallback
    return json(res, 200, await answer({ message, history }))
  }

  throw new Error('All LLM keys exhausted - no fallback available')
}

const ROUTES = {
  '/api/submit': handleSubmit,
  '/api/extract': handleExtract,
  '/api/ask': handleAsk,
}

http.createServer(async (req, res) => {
  setCors(res)
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end() }

  const url = new URL(req.url, `http://127.0.0.1:${PORT}`)

  try {
    if (url.pathname === '/health') return json(res, 200, { ok: true })

    const handler = ROUTES[url.pathname]
    if (handler && req.method === 'POST') return await handler(req, res)

    return json(res, 404, { error: 'Not found' })
  } catch (err) {
    console.error('[nodejs]', err && err.message)
    return json(res, 500, { error: err instanceof Error ? err.message : 'server error' })
  }
}).listen(PORT, '127.0.0.1', () => {
  console.log(`[senanginvoice-node] listening on http://127.0.0.1:${PORT}`)
})
