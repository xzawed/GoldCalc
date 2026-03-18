import type { HistoryEntry, ForecastPoint } from '@/types/gold'
import { format, addDays } from 'date-fns'

export function calcMA(values: number[], period: number): number[] {
  return values.map((_, i) => {
    if (i < period - 1) return NaN
    const slice = values.slice(i - period + 1, i + 1)
    return slice.reduce((a, b) => a + b, 0) / period
  })
}

export function calcLinearRegression(values: number[]): { slope: number; intercept: number } {
  const n = values.length
  if (n < 2) return { slope: 0, intercept: values[0] ?? 0 }
  const xMean = (n - 1) / 2
  const yMean = values.reduce((a, b) => a + b, 0) / n
  let numerator = 0
  let denominator = 0
  values.forEach((y, x) => {
    numerator += (x - xMean) * (y - yMean)
    denominator += (x - xMean) ** 2
  })
  const slope = denominator === 0 ? 0 : numerator / denominator
  const intercept = yMean - slope * xMean
  return { slope, intercept }
}

export function calcStdDev(values: number[]): number {
  if (values.length < 2) return 0
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length
  return Math.sqrt(variance)
}

export function computeForecast(history: HistoryEntry[], days: 7 | 30): ForecastPoint[] {
  const prices = history.map((e) => e.priceKRW)
  const lookback = Math.min(90, prices.length)
  const recentPrices = prices.slice(-lookback)

  const { slope, intercept } = calcLinearRegression(recentPrices)
  const stdDev = calcStdDev(recentPrices)

  const lastDate = new Date(history[history.length - 1].date)
  const startIdx = recentPrices.length

  const forecastPoints: ForecastPoint[] = history.slice(-14).map((e) => ({
    date: e.date,
    actual: e.priceKRW,
    predicted: undefined,
    upper: undefined,
    lower: undefined,
  }))

  for (let i = 1; i <= days; i++) {
    const predicted = Math.round(slope * (startIdx + i - 1) + intercept)
    forecastPoints.push({
      date: format(addDays(lastDate, i), 'yyyy-MM-dd'),
      actual: undefined,
      predicted,
      upper: Math.round(predicted + stdDev),
      lower: Math.round(predicted - stdDev),
    })
  }

  return forecastPoints
}

export function getTrend(history: HistoryEntry[]): 'bullish' | 'bearish' | 'neutral' {
  const prices = history.map((e) => e.priceKRW)
  if (prices.length < 20) return 'neutral'
  const ma5 = calcMA(prices, 5)
  const ma20 = calcMA(prices, 20)
  const lastMA5 = ma5[ma5.length - 1]
  const lastMA20 = ma20[ma20.length - 1]
  if (isNaN(lastMA5) || isNaN(lastMA20)) return 'neutral'
  if (lastMA5 > lastMA20 * 1.001) return 'bullish'
  if (lastMA5 < lastMA20 * 0.999) return 'bearish'
  return 'neutral'
}
