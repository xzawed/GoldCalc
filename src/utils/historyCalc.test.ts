import { describe, it, expect } from 'vitest'
import { calcChangeRate, calcPeriodSummary, addChangeRates } from './historyCalc'
import { mockHistoryEntries } from '@/test/fixtures/goldData'
import type { HistoryEntry } from '@/types/gold'

describe('calcChangeRate', () => {
  it('calculates positive change rate correctly', () => {
    // (145300 - 144800) / 144800 * 100 ≈ 0.3453
    const result = calcChangeRate(145300, 144800)
    expect(result).toBeCloseTo(0.3453, 2)
  })

  it('calculates negative change rate correctly', () => {
    const result = calcChangeRate(144800, 145300)
    expect(result).toBeCloseTo(-0.3443, 2)
  })

  it('returns 0 when previous is 0', () => {
    expect(calcChangeRate(100, 0)).toBe(0)
  })

  it('returns 0 when no change', () => {
    expect(calcChangeRate(100, 100)).toBe(0)
  })

  it('calculates large change correctly', () => {
    const result = calcChangeRate(200, 100)
    expect(result).toBe(100)
  })
})

describe('calcPeriodSummary', () => {
  it('returns null for empty array', () => {
    expect(calcPeriodSummary([])).toBeNull()
  })

  it('calculates highest price correctly', () => {
    const summary = calcPeriodSummary(mockHistoryEntries)
    expect(summary).not.toBeNull()
    expect(summary!.highest.priceKRW).toBe(146500)
    expect(summary!.highest.date).toBe('2026-03-18')
  })

  it('calculates lowest price correctly', () => {
    const summary = calcPeriodSummary(mockHistoryEntries)
    expect(summary).not.toBeNull()
    expect(summary!.lowest.priceKRW).toBe(144200)
    expect(summary!.lowest.date).toBe('2026-03-14')
  })

  it('calculates average price correctly', () => {
    // (144200 + 144800 + 145300 + 145800 + 146500) / 5 = 145320
    const summary = calcPeriodSummary(mockHistoryEntries)
    expect(summary).not.toBeNull()
    expect(summary!.averageKRW).toBe(145320)
  })

  it('returns integer for averageKRW (Math.round applied)', () => {
    const entries: HistoryEntry[] = [
      { date: '2026-03-14', priceUSD: 2620, priceKRW: 100 },
      { date: '2026-03-15', priceUSD: 2630, priceKRW: 101 },
    ]
    const summary = calcPeriodSummary(entries)
    expect(summary!.averageKRW).toBe(101) // Math.round(100.5) = 101
  })

  it('works with single entry', () => {
    const single = [mockHistoryEntries[0]]
    const summary = calcPeriodSummary(single)
    expect(summary).not.toBeNull()
    expect(summary!.highest).toBe(single[0])
    expect(summary!.lowest).toBe(single[0])
    expect(summary!.averageKRW).toBe(single[0].priceKRW)
  })
})

describe('addChangeRates', () => {
  it('first entry has undefined changeRate', () => {
    const result = addChangeRates(mockHistoryEntries)
    expect(result[0].changeRate).toBeUndefined()
  })

  it('subsequent entries have calculated changeRate', () => {
    const result = addChangeRates(mockHistoryEntries)
    // (144800 - 144200) / 144200 * 100
    expect(result[1].changeRate).toBeCloseTo(calcChangeRate(144800, 144200), 5)
  })

  it('returns array of same length', () => {
    const result = addChangeRates(mockHistoryEntries)
    expect(result).toHaveLength(mockHistoryEntries.length)
  })

  it('preserves original entry data', () => {
    const result = addChangeRates(mockHistoryEntries)
    expect(result[0].date).toBe('2026-03-14')
    expect(result[0].priceUSD).toBe(2620)
    expect(result[0].priceKRW).toBe(144200)
  })

  it('handles empty array', () => {
    expect(addChangeRates([])).toEqual([])
  })

  it('handles single entry', () => {
    const result = addChangeRates([mockHistoryEntries[0]])
    expect(result).toHaveLength(1)
    expect(result[0].changeRate).toBeUndefined()
  })

  it('calculates negative change rate when price drops', () => {
    const entries: HistoryEntry[] = [
      { date: '2026-03-17', priceUSD: 2650, priceKRW: 146000 },
      { date: '2026-03-18', priceUSD: 2640, priceKRW: 145000 },
    ]
    const result = addChangeRates(entries)
    expect(result[1].changeRate).toBeLessThan(0)
  })
})
