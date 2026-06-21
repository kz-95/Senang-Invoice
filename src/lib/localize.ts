import type { Lang } from '@/lib/types'

export type Loc = { en: string; ms: string; zh: string }

export function pickLoc(v: Loc | string, lang: Lang): string {
  if (typeof v === 'string') return v
  return v[lang as 'en' | 'ms' | 'zh'] ?? v.en
}
