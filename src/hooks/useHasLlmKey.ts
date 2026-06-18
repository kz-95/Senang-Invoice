'use client'

import { useEffect, useState } from 'react'
import { llmKeyRepository } from '@/services/data/llmKeyRepository'
import { useLlmKeyStore } from '@/stores/llmKeyStore'

export function useHasLlmKey(): boolean {
  const version = useLlmKeyStore(s => s.version)
  const [has, setHas] = useState(true) // optimistic: assume yes until checked

  useEffect(() => {
    llmKeyRepository.getAll().then(keys => setHas(keys.some(k => k.isActive)))
  }, [version])

  return has
}
