import strings from '@/data/i18n/strings.json'
import type { Lang } from '@/lib/types'

const FALLBACK: Record<Lang, Lang[]> = {
  en: ['en'],
  ms: ['ms', 'en'],
  zh: ['zh', 'en'],
  rojak: ['rojak', 'ms', 'en'],
}

export function translate(key: string, lang: Lang, vars?: Record<string, string | number>): string {
  const store: Record<string, Partial<Record<Lang, string>>> = strings
  const row = store[key]
  let out = key
  if (row) {
    for (const l of FALLBACK[lang]) {
      if (row[l]) {
        out = row[l]!
        break
      }
    }
  }
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      out = out.replace(`{${k}}`, String(v))
    }
  }
  return out
}
