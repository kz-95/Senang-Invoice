import type { NumberPreset } from '@/lib/types'

export const DEFAULT_PRESETS: NumberPreset[] = [
  {
    id: 'preset-simple-seq',
    name: 'Simple Sequential',
    pattern: 'INV-{seq:0000}',
    customTokens: {},
    reset: 'never',
    nextSeq: 1,
    isDefault: true,
  },
  {
    id: 'preset-ym-seq',
    name: 'Year-Month Sequence',
    pattern: '{YYYY}-{MM}-{seq:000}',
    customTokens: {},
    reset: 'monthly',
    nextSeq: 1,
  },
  {
    id: 'preset-y-seq',
    name: 'Year Sequence',
    pattern: '{YYYY}/{seq:0000}',
    customTokens: {},
    reset: 'yearly',
    nextSeq: 1,
  },
  {
    id: 'preset-branch',
    name: 'Branch Name',
    pattern: '{branch}-{seq:000}',
    customTokens: {
      branch: { label: 'Branch', default: '' },
    },
    reset: 'never',
    nextSeq: 1,
  },
  {
    id: 'preset-dept-cat',
    name: 'Department + Category',
    pattern: 'INV-{dept}-{cat}-{seq:00}',
    customTokens: {
      dept: { label: 'Department', default: '' },
      cat: { label: 'Category', default: '' },
    },
    reset: 'never',
    nextSeq: 1,
  },
]

export function cloneDefaultPresets(): NumberPreset[] {
  return DEFAULT_PRESETS.map(p => ({ ...p, customTokens: { ...p.customTokens } }))
}

export interface FormatResult {
  number: string
  newPreset: NumberPreset
}

export function formatInvoiceNumber(
  preset: NumberPreset,
  tokenValues: Record<string, string> = {},
  issueDate?: string
): FormatResult {
  const p = { ...preset, customTokens: { ...preset.customTokens } }
  const d = issueDate ? new Date(issueDate) : new Date()
  const YYYY = d.getFullYear().toString()
  const MM = String(d.getMonth() + 1).padStart(2, '0')
  const DD = String(d.getDate()).padStart(2, '0')

  const period =
    p.reset === 'yearly' ? YYYY :
    p.reset === 'monthly' ? `${YYYY}-${MM}` :
    null

  if (period && p.lastResetPeriod !== period) {
    p.nextSeq = 1
    p.lastResetPeriod = period
  }

  const padMatch = p.pattern.match(/\{seq:(\d+)\}/)
  const padDigits = padMatch ? padMatch[1] : '0000'
  const padLen = Math.max(1, padDigits.length)

  let number = p.pattern
  number = number.replace(/\{seq:\d+\}/, String(p.nextSeq).padStart(padLen, '0'))
  number = number.replace(/\{seq\}/g, String(p.nextSeq).padStart(padLen, '0'))
  number = number.replace(/\{YYYY}/g, YYYY)
  number = number.replace(/\{MM}/g, MM)
  number = number.replace(/\{DD}/g, DD)

  for (const [token, def] of Object.entries(p.customTokens)) {
    const value = tokenValues[token] ?? def.default ?? ''
    number = number.replace(new RegExp(`\\{${token}\\}`, 'g'), value || token.toUpperCase())
  }

  p.nextSeq = p.nextSeq + 1
  return { number, newPreset: p }
}

export function validatePattern(pattern: string, customTokens: Record<string, { label: string; default?: string }>): string | null {
  if (!pattern.includes('{seq')) {
    return 'Pattern must include at least one {seq:N} token for auto-increment.'
  }

  const tokenRegex = /\{(\w+(?::\d+)?)\}/g
  const resolved = new Set<string>()
  let m: RegExpExecArray | null
  while ((m = tokenRegex.exec(pattern)) !== null) {
    const raw = m[1]
    if (/^(YYYY|MM|DD)$/.test(raw)) {
      resolved.add(raw)
      continue
    }
    const seqMatch = raw.match(/^seq:(\d+)$/)
    if (seqMatch) {
      resolved.add(`seq:${seqMatch[1]}`)
      continue
    }
    if (raw === 'seq') {
      resolved.add('seq:4')
      continue
    }
    const tokenName = raw
    if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(tokenName)) {
      return `Custom token "{${tokenName}}" is not a valid identifier. Use letters, numbers, hyphens, or underscores.`
    }
    if (!customTokens[tokenName]) {
      return `Custom token "{${tokenName}}" is used in the pattern but not defined. Add it in Custom Tokens.`
    }
    resolved.add(tokenName)
  }

  return null
}

export function getCustomTokensFromPattern(pattern: string): string[] {
  const tokenRegex = /\{(\w+)\}/g
  const builtin = new Set(['YYYY', 'MM', 'DD', 'seq'])
  const tokens = new Set<string>()
  let m: RegExpExecArray | null
  while ((m = tokenRegex.exec(pattern)) !== null) {
    const name = m[1]
    if (!builtin.has(name) && !/^seq:\d+$/.test(name)) {
      tokens.add(name)
    }
  }
  return Array.from(tokens)
}
