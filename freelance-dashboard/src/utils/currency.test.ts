import { describe, it, expect } from 'vitest'
import { formatCurrency } from './currency'

describe('formatCurrency', () => {
  it('formats positive numbers correctly', () => {
    expect(formatCurrency(1234.56)).toBe('$1,234.56')
  })

  it('formats zero correctly', () => {
    expect(formatCurrency(0)).toBe('$0.00')
  })

  it('handles PKR currency (if implemented or default is USD)', () => {
    // Current implementation uses USD default
    expect(formatCurrency(100)).toBe('$100.00')
  })
})
