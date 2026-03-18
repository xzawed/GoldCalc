import type { HistoryEntry, PeriodSummary } from '@/types/gold'

export function calcChangeRate(current: number, previous: number): number {
  if (previous === 0) return 0
  return ((current - previous) / previous) * 100
}

export function calcPeriodSummary(entries: HistoryEntry[]): PeriodSummary | null {
  if (entries.length === 0) return null

  const highest = entries.reduce((a, b) => (a.priceKRW >= b.priceKRW ? a : b))
  const lowest = entries.reduce((a, b) => (a.priceKRW <= b.priceKRW ? a : b))
  const averageKRW = Math.round(entries.reduce((sum, e) => sum + e.priceKRW, 0) / entries.length)

  return { highest, lowest, averageKRW }
}

export function addChangeRates(entries: HistoryEntry[]): (HistoryEntry & { changeRate?: number })[] {
  return entries.map((entry, i) => ({
    ...entry,
    changeRate: i > 0 ? calcChangeRate(entry.priceKRW, entries[i - 1].priceKRW) : undefined,
  }))
}
