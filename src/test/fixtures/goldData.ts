import type { GoldPriceResponse, HistoryEntry, ForecastPoint } from '@/types/gold'

export const mockGoldPrice: GoldPriceResponse = {
  priceUSD: 2650.5,
  priceKRW: 146_500,
  exchangeRate: 1380,
  changePercent: 0.85,
  updatedAt: '2026-03-18T09:00:00Z',
}

export const mockHistoryEntries: HistoryEntry[] = [
  { date: '2026-03-14', priceUSD: 2620, priceKRW: 144_200, volume: 1200 },
  { date: '2026-03-15', priceUSD: 2630, priceKRW: 144_800, volume: 1350 },
  { date: '2026-03-16', priceUSD: 2640, priceKRW: 145_300, volume: 980 },
  { date: '2026-03-17', priceUSD: 2645, priceKRW: 145_800, volume: 1100 },
  { date: '2026-03-18', priceUSD: 2650.5, priceKRW: 146_500, volume: 1400 },
]

export const mockForecastPoints: ForecastPoint[] = [
  { date: '2026-03-19', predicted: 147_000, upper: 149_000, lower: 145_000 },
  { date: '2026-03-20', predicted: 147_500, upper: 149_800, lower: 145_200 },
  { date: '2026-03-21', predicted: 148_000, upper: 150_500, lower: 145_500 },
  { date: '2026-03-22', predicted: 148_500, upper: 151_200, lower: 145_800 },
  { date: '2026-03-23', predicted: 149_000, upper: 151_900, lower: 146_100 },
  { date: '2026-03-24', predicted: 149_500, upper: 152_600, lower: 146_400 },
  { date: '2026-03-25', predicted: 150_000, upper: 153_300, lower: 146_700 },
]
