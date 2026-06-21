'use client'

/**
 * Built-in LLM key is always active — no banner needed.
 * The key manager is gated behind "Coming Soon" until the
 * bring-your-own-key feature launches.
 */
export function useHasLlmKey(): boolean {
  return true
}
