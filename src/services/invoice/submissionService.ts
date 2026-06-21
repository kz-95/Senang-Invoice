import type { ValidationResult } from '@/lib/types'
import { mockValidate } from './validationService'
import { createMyInvoisClient, type MyInvoisConfig } from './myInvoisClient'
import { createSigningService, type SigningConfig } from './signingService'

export interface SubmitOpts {
  mode: 'mock' | 'sandbox' | 'production'
  creds?: MyInvoisConfig
  signing?: SigningConfig
  clientFactory?: (config: MyInvoisConfig, fetchFn?: typeof fetch, signingService?: ReturnType<typeof createSigningService>) => { submitAndAwait: (ubl: object, code: string) => Promise<ValidationResult> }
}

function errorResult(message: string): ValidationResult {
  return { uuid: '', longId: '', qrLink: '', validatedAt: new Date().toISOString(), status: 'invalid', error: message }
}

export async function submitInvoice(
  ublObject: object,
  codeNumber: string,
  opts: SubmitOpts
): Promise<ValidationResult> {
  if (opts.mode === 'mock') {
    return mockValidate(ublObject)
  }
  if (opts.mode !== 'sandbox' && opts.mode !== 'production') {
    return errorResult(`Unknown submission mode: ${opts.mode}. Expected 'mock', 'sandbox', or 'production'.`)
  }
  const { creds } = opts
  if (!creds || !creds.clientId || !creds.clientSecret || !creds.apiBase || !creds.portalBase) {
    return errorResult('MyInvois credentials missing - add them in Settings or set SENANG_MYINVOIS_* in .env.local.')
  }

  const signingService = opts.signing
    ? createSigningService(opts.signing)
    : undefined

  const factory = opts.clientFactory ?? createMyInvoisClient
  const client = factory(creds, undefined, signingService)
  try {
    return await client.submitAndAwait(ublObject, codeNumber)
  } catch (err) {
    return errorResult(err instanceof Error ? err.message : 'Submission failed')
  }
}
