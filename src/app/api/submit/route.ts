import { NextRequest, NextResponse } from 'next/server'
import { submitInvoice } from '@/services/invoice/submissionService'
import type { MyInvoisConfig } from '@/services/invoice/myInvoisClient'

function resolveCreds(req: NextRequest): MyInvoisConfig | null {
  const clientId = req.headers.get('x-myinvois-client-id')
    ?? process.env.SENANG_MYINVOIS_CLIENT_ID
  const clientSecret = process.env.SENANG_MYINVOIS_CLIENT_SECRET
  const apiBase = process.env.SENANG_MYINVOIS_API_BASE
    ?? 'https://preprod-api.myinvois.hasil.gov.my'
  const portalBase = process.env.NEXT_PUBLIC_MYINVOIS_BASE
    ?? 'https://preprod.myinvois.hasil.gov.my'

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
    const mode: 'mock' | 'sandbox' | 'production' =
      (creds && envMode === 'sandbox') ? 'sandbox'
        : (creds && envMode === 'production') ? 'production'
        : 'mock'

    const signingMode = process.env.SENANG_MYINVOIS_SIGNING_MODE
    const signing = (mode === 'production' || signingMode === 'production')
      ? {
          mode: 'production' as const,
          certPath: process.env.SENANG_MYINVOIS_CERT_PATH,
          keyPath: process.env.SENANG_MYINVOIS_KEY_PATH,
          passphrase: process.env.SENANG_MYINVOIS_CERT_PASSPHRASE,
        }
      : undefined

    const result = await submitInvoice(body.ubl, codeNumber, { mode, creds: creds ?? undefined, signing })
    return NextResponse.json(result)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Submission failed'
    console.error('[/api/submit]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
