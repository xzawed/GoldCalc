import { describe, it, expect } from 'vitest'
import { formatKRW, formatUSD, formatChangeRate, getChangeColor, formatDate } from './format'

describe('formatKRW', () => {
  it('formats positive numbers with KRW symbol and commas', () => {
    expect(formatKRW(146500)).toBe('₩146,500')
  })

  it('formats zero correctly', () => {
    expect(formatKRW(0)).toBe('₩0')
  })

  it('formats large numbers with commas', () => {
    expect(formatKRW(1_000_000)).toBe('₩1,000,000')
  })
})

describe('formatUSD', () => {
  it('formats with USD symbol and 2 decimal places', () => {
    expect(formatUSD(2650.5)).toBe('$2,650.50')
  })

  it('formats zero correctly', () => {
    expect(formatUSD(0)).toBe('$0.00')
  })
})

describe('formatChangeRate', () => {
  it('formats positive rate with + sign and %', () => {
    expect(formatChangeRate(0.85)).toBe('+0.85%')
  })

  it('formats negative rate with - sign and %', () => {
    expect(formatChangeRate(-1.23)).toBe('-1.23%')
  })

  it('formats zero', () => {
    expect(formatChangeRate(0)).toBe('+0.00%')
  })
})

describe('getChangeColor', () => {
  it('returns red class for positive change (price up)', () => {
    expect(getChangeColor(1)).toContain('text-red')
  })

  it('returns blue class for negative change (price down)', () => {
    expect(getChangeColor(-1)).toContain('text-blue')
  })

  it('returns muted class for zero change', () => {
    expect(getChangeColor(0)).toContain('muted')
  })
})

describe('formatDate', () => {
  it('formats ISO date string to Korean locale date', () => {
    const result = formatDate('2026-03-18')
    expect(result).toBe('2026. 3. 18.')
  })
})
