import { createHash } from 'crypto'
import type { ValidationResult } from '@/lib/types'

export interface MyInvoisConfig {
  apiBase: string
  portalBase: string
  clientId: string
  clientSecret: string
}

type FetchFn = typeof fetch

export function createMyInvoisClient(config: MyInvoisConfig, fetchFn: FetchFn = fetch) {
  let cached: { token: string; expiresAt: number } | null = null

  async function getToken(): Promise<string> {
    const now = Date.now()
    if (cached && cached.expiresAt - 60_000 > now) return cached.token

    const body = new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      grant_type: 'client_credentials',
      scope: 'InvoicingAPI',
    })
    const res = await fetchFn(`${config.apiBase}/connect/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    })
    if (!res.ok) throw new Error('MyInvois auth failed (check client id/secret)')
    const data = (await res.json()) as { access_token: string; expires_in: number }
    cached = { token: data.access_token, expiresAt: now + data.expires_in * 1000 }
    return data.access_token
  }

  async function submitDocument(ublObject: object, codeNumber: string) {
    const token = await getToken()
    const minified = JSON.stringify(ublObject)
    const document = Buffer.from(minified, 'utf8').toString('base64')
    const documentHash = createHash('sha256').update(minified, 'utf8').digest('base64')

    const res = await fetchFn(`${config.apiBase}/api/v1.0/documentsubmissions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        documents: [{ format: 'JSON', document, documentHash, codeNumber }],
      }),
    })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(`MyInvois submission rejected (HTTP ${res.status}): ${text.slice(0, 500)}`)
    }
    const data = (await res.json()) as {
      submissionUid: string
      acceptedDocuments?: { uuid: string }[]
    }
    return { submissionUid: data.submissionUid, uuid: data.acceptedDocuments?.[0]?.uuid }
  }

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

  async function getSubmission(submissionUid: string, token: string) {
    const res = await fetchFn(
      `${config.apiBase}/api/v1.0/documentsubmissions/${submissionUid}?pageNo=1&pageSize=10`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    if (!res.ok) throw new Error(`MyInvois poll failed (HTTP ${res.status})`)
    return (await res.json()) as {
      overallStatus: string
      documentSummary?: { uuid: string; status: string }[]
    }
  }

  async function getDocumentDetails(uuid: string, token: string) {
    const res = await fetchFn(`${config.apiBase}/api/v1.0/documents/${uuid}/details`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) throw new Error(`MyInvois details failed (HTTP ${res.status})`)
    return (await res.json()) as {
      uuid: string; longId?: string; status?: string
      validationResults?: { validationSteps?: { status: string; error?: { errorMessage?: string } }[] }
    }
  }

  async function submitAndAwait(
    ublObject: object,
    codeNumber: string,
    opts: { delayMs?: number; maxTries?: number } = {}
  ): Promise<ValidationResult> {
    const delayMs = opts.delayMs ?? 4000
    const maxTries = opts.maxTries ?? 8
    const token = await getToken()
    const { submissionUid, uuid } = await submitDocument(ublObject, codeNumber)
    const validatedAt = new Date().toISOString()

    if (!uuid) {
      return { uuid: '', longId: '', qrLink: '', validatedAt, status: 'pending', submissionUid }
    }

    const docUuid = uuid

    let settled: 'Valid' | 'Invalid' | null = null
    for (let i = 0; i < maxTries; i++) {
      try {
        const sub = await getSubmission(submissionUid, token)
        if (sub.overallStatus === 'Valid' || sub.overallStatus === 'PartiallyValid') { settled = 'Valid'; break }
        if (sub.overallStatus === 'Invalid') { settled = 'Invalid'; break }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'poll error'
        console.error(`[myInvoisClient] poll attempt ${i + 1} failed: ${msg}`)
      }
      if (i < maxTries - 1) await sleep(delayMs)
    }

    if (settled === null) {
      return { uuid: docUuid, longId: '', qrLink: '', validatedAt, status: 'pending', submissionUid }
    }

    let details = null
    try {
      details = await getDocumentDetails(docUuid, token)
    } catch (err) {
      console.error(`[myInvoisClient] details fetch failed: ${err instanceof Error ? err.message : err}`)
    }
    if (!details || settled === 'Invalid' || !details.longId) {
      const rejections = (details?.validationResults?.validationSteps ?? [])
        .filter((s) => s.status === 'Invalid')
        .map((s) => s.error?.errorMessage ?? 'Unknown validation error')
      return { uuid: docUuid, longId: '', qrLink: '', validatedAt, status: 'invalid', submissionUid, rejections }
    }

    const qrLink = `${config.portalBase.replace(/\/+$/, '')}/${details.uuid}/share/${details.longId}`
    return { uuid: details.uuid, longId: details.longId, qrLink, validatedAt, status: 'valid', submissionUid }
  }

  return { getToken, submitDocument, submitAndAwait }
}
