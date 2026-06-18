'use client'
import { useUiStore } from '@/stores/uiStore'
import { translate } from '@/lib/i18n'

export function useT() {
  const lang = useUiStore(s => s.lang)
  return (key: string, vars?: Record<string, string | number>) => translate(key, lang, vars)
}
