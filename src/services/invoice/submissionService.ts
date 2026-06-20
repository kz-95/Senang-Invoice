import type { ValidationResult } from '@/lib/types'
import { mockValidate } from './validationService'
import { createMyInvoisClient, type MyInvoisConfig } from './myInvoisClient'

export interface SubmitOpts {
  mode: 'mock' | 'sandbox'
  creds?: MyInvoisConfig
  clientFactory?: (config: MyInvoisConfig) => { submitAndAwait: (ubl: object, code: string) => Promise<ValidationResult> }
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
  if (opts.mode !== 'sandbox') {
    return errorResult(`Unknown submission mode: ${opts.mode}. Expected 'mock' or 'sandbox'.`)
  }
  const { creds } = opts
  if (!creds || !creds.clientId || !creds.clientSecret || !creds.apiBase || !creds.portalBase) {
    return errorResult('MyInvois sandbox credentials missing - add them in Settings or set SENANG_MYINVOIS_* in .env.local.')
  }
  const factory = opts.clientFactory ?? createMyInvoisClient
  const client = factory(creds)
  try {
    return await client.submitAndAwait(ublObject, codeNumber)
  } catch (err) {
    return errorResult(err instanceof Error ? err.message : 'Submission failed')
  }
}
