const http = require('http')

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

const PORT = 3001

http.createServer(async (req, res) => {
  setCors(res)
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end() }

  const url = new URL(req.url, `http://127.0.0.1:${PORT}`)

  try {
    // Health check endpoint
    if (url.pathname === '/health') {
      res.writeHead(200)
      return res.end(JSON.stringify({ ok: true }))
    }

    // Serve compiled service modules from nodejs/services/
    if (url.pathname === '/api/submit' && req.method === 'POST') {
      try {
        const { submitInvoice } = require('./services/invoice/submissionService')
        const body = JSON.parse(await readBody(req))
        const creds = {
          clientId: req.headers['x-myinvois-client-id'] || '',
          clientSecret: req.headers['x-myinvois-client-secret'] || '',
          apiBase: req.headers['x-myinvois-api-base'] || 'https://preprod-api.myinvois.hasil.gov.my',
          portalBase: 'https://preprod.myinvois.hasil.gov.my',
        }
        const mode = creds.clientId && creds.clientSecret ? 'sandbox' : 'mock'
        const result = await submitInvoice(body.ubl, body.codeNumber, { mode, creds })
        res.writeHead(200)
        return res.end(JSON.stringify(result))
      } catch (e) {
        console.error('[nodejs /api/submit]', e.message)
        res.writeHead(500)
        return res.end(JSON.stringify({ error: e.message }))
      }
    }

    // Future: add /api/extract, /api/ask, /api/llm-models endpoints here

    res.writeHead(404)
    res.end(JSON.stringify({ error: 'Not found' }))
  } catch (err) {
    console.error('[nodejs]', err.message)
    res.writeHead(500)
    res.end(JSON.stringify({ error: err.message }))
  }
}).listen(PORT, '127.0.0.1', () => {
  console.log(`[senanginvoice-node] listening on http://127.0.0.1:${PORT}`)
})
