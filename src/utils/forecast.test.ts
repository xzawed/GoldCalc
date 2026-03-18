import { describe, it, expect } from 'vitest'
import { calcMA, calcLinearRegression, calcStdDev, computeForecast, getTrend } from './forecast'
import type { HistoryEntry } from '@/types/gold'

// Helper to create mock history entries
function makeHistory(prices: number[]): HistoryEntry[] {
  return prices.map((priceKRW, i) => ({
    date: `2026-01-${String(i + 1).padStart(2, '0')}`,
    priceUSD: priceKRW / 1380 * 31.1035,
    priceKRW,
  }))
}

describe('calcMA', () => {
  it('calculates 3-period MA correctly', () => {
    const values = [10, 20, 30, 40, 50]
    const ma3 = calcMA(values, 3)
    expect(ma3[0]).toBeNaN()
    expect(ma3[1]).toBeNaN()
    expect(ma3[2]).toBeCloseTo(20, 5) // (10+20+30)/3
    expect(ma3[3]).toBeCloseTo(30, 5) // (20+30+40)/3
    expect(ma3[4]).toBeCloseTo(40, 5) // (30+40+50)/3
  })

  it('calculates 5-period MA correctly', () => {
    const values = [100, 200, 300, 400, 500, 600]
    const ma5 = calcMA(values, 5)
    expect(ma5[0]).toBeNaN()
    expect(ma5[3]).toBeNaN()
    expect(ma5[4]).toBeCloseTo(300, 5) // (100+200+300+400+500)/5
    expect(ma5[5]).toBeCloseTo(400, 5) // (200+300+400+500+600)/5
  })

  it('returns NaN for indices less than period-1', () => {
    const values = [1, 2, 3, 4, 5]
    const ma5 = calcMA(values, 5)
    for (let i = 0; i < 4; i++) {
      expect(ma5[i]).toBeNaN()
    }
  })

  it('handles period of 1 (no smoothing)', () => {
    const values = [10, 20, 30]
    const ma1 = calcMA(values, 1)
    expect(ma1).toEqual([10, 20, 30])
  })

  it('handles single value array with period 1', () => {
    const result = calcMA([42], 1)
    expect(result[0]).toBe(42)
  })

  it('handles identical values', () => {
    const values = [100, 100, 100, 100, 100]
    const ma3 = calcMA(values, 3)
    expect(ma3[2]).toBe(100)
    expect(ma3[4]).toBe(100)
  })
})

describe('calcLinearRegression', () => {
  it('calculates slope and intercept for perfect linear data', () => {
    // y = 2x + 1: [1, 3, 5, 7, 9]
    const values = [1, 3, 5, 7, 9]
    const { slope, intercept } = calcLinearRegression(values)
    expect(slope).toBeCloseTo(2, 5)
    expect(intercept).toBeCloseTo(1, 5)
  })

  it('calculates slope 0 for constant data', () => {
    const values = [100, 100, 100, 100]
    const { slope, intercept } = calcLinearRegression(values)
    expect(slope).toBeCloseTo(0, 5)
    expect(intercept).toBeCloseTo(100, 5)
  })

  it('calculates negative slope for decreasing data', () => {
    const values = [10, 8, 6, 4, 2]
    const { slope } = calcLinearRegression(values)
    expect(slope).toBeLessThan(0)
  })

  it('handles single value', () => {
    const { slope, intercept } = calcLinearRegression([50])
    expect(slope).toBe(0)
    expect(intercept).toBe(50)
  })

  it('handles two values', () => {
    const { slope, intercept } = calcLinearRegression([0, 10])
    expect(slope).toBeCloseTo(10, 5)
    expect(intercept).toBeCloseTo(0, 5)
  })

  it('returns correct intercept prediction at x=0', () => {
    const values = [5, 10, 15, 20, 25]
    const { slope, intercept } = calcLinearRegression(values)
    // At x=0, prediction should be intercept
    expect(intercept).toBeCloseTo(5, 5)
    expect(slope).toBeCloseTo(5, 5)
  })
})

describe('calcStdDev', () => {
  it('calculates standard deviation for known values', () => {
    // [2, 4, 4, 4, 5, 5, 7, 9] mean=5, variance=4, stdDev=2
    const values = [2, 4, 4, 4, 5, 5, 7, 9]
    const result = calcStdDev(values)
    expect(result).toBeCloseTo(2, 5)
  })

  it('returns 0 for identical values', () => {
    expect(calcStdDev([5, 5, 5, 5])).toBe(0)
  })

  it('returns 0 for single value', () => {
    expect(calcStdDev([100])).toBe(0)
  })

  it('returns 0 for empty array (length < 2)', () => {
    expect(calcStdDev([])).toBe(0)
  })

  it('returns positive value for varying data', () => {
    expect(calcStdDev([100000, 110000, 105000, 115000])).toBeGreaterThan(0)
  })
})

describe('computeForecast', () => {
  const baseHistory = makeHistory(
    Array.from({ length: 30 }, (_, i) => 140000 + i * 200)
  )

  it('returns correct number of total points (14 historical + days)', () => {
    const result7 = computeForecast(baseHistory, 7)
    expect(result7).toHaveLength(14 + 7)

    const result30 = computeForecast(baseHistory, 30)
    expect(result30).toHaveLength(14 + 30)
  })

  it('historical points have actual values but no predicted', () => {
    const result = computeForecast(baseHistory, 7)
    const historicalPoints = result.slice(0, 14)
    historicalPoints.forEach(p => {
      expect(p.actual).toBeDefined()
      expect(p.predicted).toBeUndefined()
    })
  })

  it('forecast points have predicted, upper, lower but no actual', () => {
    const result = computeForecast(baseHistory, 7)
    const forecastPoints = result.slice(14)
    forecastPoints.forEach(p => {
      expect(p.actual).toBeUndefined()
      expect(p.predicted).toBeDefined()
      expect(p.upper).toBeDefined()
      expect(p.lower).toBeDefined()
    })
  })

  it('upper > predicted > lower for forecast points', () => {
    const result = computeForecast(baseHistory, 7)
    const forecastPoints = result.slice(14)
    forecastPoints.forEach(p => {
      expect(p.upper!).toBeGreaterThan(p.predicted!)
      expect(p.predicted!).toBeGreaterThan(p.lower!)
    })
  })

  it('forecast dates are sequential after last history date', () => {
    const result = computeForecast(baseHistory, 7)
    const lastHistoryDate = baseHistory[baseHistory.length - 1].date
    const firstForecastDate = result[14].date
    expect(new Date(firstForecastDate) > new Date(lastHistoryDate)).toBe(true)
  })

  it('works with exactly 5 history entries (minimum)', () => {
    const shortHistory = makeHistory([140000, 141000, 142000, 143000, 144000])
    const result = computeForecast(shortHistory, 7)
    // min(14, 5) history points + 7 forecast
    expect(result.length).toBe(5 + 7)
  })
})

describe('getTrend', () => {
  it('returns neutral for less than 20 entries', () => {
    const history = makeHistory(Array.from({ length: 19 }, (_, i) => 140000 + i * 100))
    expect(getTrend(history)).toBe('neutral')
  })

  it('detects bullish trend when MA5 > MA20 * 1.001', () => {
    // Create data where recent prices are significantly higher (MA5 > MA20)
    const prices = [
      ...Array.from({ length: 20 }, () => 100000), // flat baseline
      ...Array.from({ length: 10 }, (_, i) => 120000 + i * 1000), // sharp recent rise
    ]
    const history = makeHistory(prices)
    expect(getTrend(history)).toBe('bullish')
  })

  it('detects bearish trend when MA5 < MA20 * 0.999', () => {
    // Create data where recent prices are significantly lower (MA5 < MA20)
    const prices = [
      ...Array.from({ length: 20 }, () => 100000), // flat baseline
      ...Array.from({ length: 10 }, (_, i) => 80000 - i * 1000), // sharp recent drop
    ]
    const history = makeHistory(prices)
    expect(getTrend(history)).toBe('bearish')
  })

  it('returns neutral for flat trend (MA5 ≈ MA20)', () => {
    const prices = Array.from({ length: 30 }, () => 140000)
    const history = makeHistory(prices)
    expect(getTrend(history)).toBe('neutral')
  })

  it('returns neutral for exactly 20 entries with flat data', () => {
    const prices = Array.from({ length: 20 }, () => 140000)
    const history = makeHistory(prices)
    expect(getTrend(history)).toBe('neutral')
  })
})
