import { describe, it, expect } from 'vitest'
import { detectProviderForTest } from './llmClient'

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
