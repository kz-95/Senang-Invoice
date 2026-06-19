import { describe, test, expect } from 'vitest'
import { formatMYR, formatMYRWhole } from './formatters'

describe('formatMYR', () => {
  test('formats whole numbers with 2 decimal places', () => {
    expect(formatMYR(100)).toBe('100.00')
  })

  test('formats decimal amounts', () => {
    expect(formatMYR(1234.5)).toBe('1,234.50')
  })

  test('formats zero', () => {
    expect(formatMYR(0)).toBe('0.00')
  })

  test('formats large numbers with thousand separators', () => {
    expect(formatMYR(1234567.89)).toBe('1,234,567.89')
  })

  test('formats negative numbers', () => {
    expect(formatMYR(-500.25)).toBe('-500.25')
  })

  test('rounds to 2 decimal places', () => {
    expect(formatMYR(1.999)).toBe('2.00')
  })
})

describe('formatMYRWhole', () => {
  test('formats whole number without decimals', () => {
    expect(formatMYRWhole(1234)).toBe('1,234')
  })

  test('formats zero', () => {
    expect(formatMYRWhole(0)).toBe('0')
  })

  test('rounds down fractional part', () => {
    expect(formatMYRWhole(999.99)).toBe('1,000')
  })
})
