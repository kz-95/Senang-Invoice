import { NextRequest, NextResponse } from 'next/server'
import { submitInvoice } from '@/services/invoice/submissionService'
import type { MyInvoisConfig } from '@/services/invoice/myInvoisClient'

function resolveCreds(req: NextRequest): MyInvoisConfig | null {
  const hdrId = req.headers.get('x-myinvois-client-id') ?? undefined
  const hdrSecret = req.headers.get('x-myinvois-client-secret') ?? undefined
  const apiBase = req.headers.get('x-myinvois-api-base')
    ?? process.env.SENANG_MYINVOIS_API_BASE
    ?? 'https://preprod-api.myinvois.hasil.gov.my'
  const portalBase = process.env.NEXT_PUBLIC_MYINVOIS_BASE
    ?? 'https://preprod.myinvois.hasil.gov.my'

  const clientId = hdrId ?? process.env.SENANG_MYINVOIS_CLIENT_ID
  const clientSecret = hdrSecret ?? process.env.SENANG_MYINVOIS_CLIENT_SECRET
  if (!clientId || !clientSecret) return null
  return { clientId, clientSecret, apiBase, portalBase }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { ubl?: object; codeNumber?: string }
    if (!body.ubl || typeof body.ubl !== 'object') {
      return NextResponse.json({ error: 'Missing ubl document' }, { status: 400 })
    }
    const codeNumber = body.codeNumber ?? `INV-${Date.now()}`

    const creds = resolveCreds(req)
    const envMode = process.env.SENANG_MYINVOIS_MODE
    const mode: 'mock' | 'sandbox' = (creds && envMode === 'sandbox') ? 'sandbox' : 'mock'

    const result = await submitInvoice(body.ubl, codeNumber, { mode, creds: creds ?? undefined })
    return NextResponse.json(result)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Submission failed'
    console.error('[/api/submit]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
