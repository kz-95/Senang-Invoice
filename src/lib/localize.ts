import type { Lang } from '@/lib/types'

export type Loc = { en: string; ms: string; zh: string }

export function pickLoc(v: Loc | string, lang: Lang): string {
  if (typeof v === 'string') return v
  if (lang === 'rojak') return v.ms || v.en
  return v[lang as 'en' | 'ms' | 'zh'] ?? v.en
}
