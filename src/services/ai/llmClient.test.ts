import { describe, it, expect } from 'vitest'
import { detectProviderForTest, getEnvKeyForTest } from './llmClient'

describe('detectProvider', () => {
  it('detects AQ-prefixed Gemini keys', () => {
    expect(detectProviderForTest('AQ.Ab8RN6KByPyeJ')).toBe('gemini')
  })
  it('still detects AIza Gemini keys', () => {
    expect(detectProviderForTest('AIzaSyXXXXXXXX')).toBe('gemini')
  })
  it('detects sk-ant Anthropic keys', () => {
    expect(detectProviderForTest('sk-ant-abc')).toBe('anthropic')
  })
})

describe('getEnvKeyFor', () => {
  it('finds the gemini key by provider prefix', () => {
    process.env.SENANG_LLM_KEYS = 'deepseek:sk-abc,gemini:AQ.xyz'
    expect(getEnvKeyForTest('gemini')).toEqual({ key: 'AQ.xyz', provider: 'gemini' })
    expect(getEnvKeyForTest('deepseek')).toEqual({ key: 'sk-abc', provider: 'deepseek' })
  })
  it('returns null when provider absent', () => {
    process.env.SENANG_LLM_KEYS = 'deepseek:sk-abc'
    expect(getEnvKeyForTest('gemini')).toBeNull()
  })
})
