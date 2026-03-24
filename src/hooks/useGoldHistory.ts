import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/utils/api'
import { calcPricePerGram } from '@/utils/goldCalc'
import { getDailyCache, setDailyCache } from '@/utils/dailyCache'
import { getPersistentCache, setPersistentCache } from '@/utils/persistentCache'
import { format, subDays } from 'date-fns'
import type { Period, HistoryEntry } from '@/types/gold'

interface GoldAPIHistoryRaw {
  timestamp: number
  close?: number
  price?: number
  prev_close_price?: number
}

function getDatesForPeriod(period: Period): string[] {
  const today = new Date()
  const config: Record<Period, { days: number; step: number }> = {
    '1W': { days: 7, step: 1 },
    '1M': { days: 30, step: 1 },
    '3M': { days: 90, step: 3 },
    '1Y': { days: 365, step: 7 },
  }
  const { days, step } = config[period]
  const dates: string[] = []
  for (let i = days; i >= 1; i -= step) {
    dates.push(format(subDays(today, i), 'yyyyMMdd'))
  }
  return dates
}

async function fetchDayHistory(
  date: string,
  exchangeRate: number
): Promise<HistoryEntry | null> {
  try {
    const data = await apiFetch<GoldAPIHistoryRaw>(
      `${import.meta.env.VITE_GOLD_API_URL}/XAU/USD/${date}`,
      { 'x-access-token': import.meta.env.VITE_GOLD_API_KEY }
    )
    const priceUSD = data.close ?? data.price ?? 0
    if (!priceUSD) return null
    return {
      date: `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`,
      priceUSD,
      priceKRW: Math.round(calcPricePerGram(priceUSD, exchangeRate) * 0.9999),
    }
  } catch {
    return null
  }
}

export function useGoldHistory(period: Period, exchangeRate: number) {
  return useQuery({
    queryKey: ['goldHistory', period],
    queryFn: async (): Promise<HistoryEntry[]> => {
      const cacheKey = `goldhistory:${period}`

      // 1. 당일 캐시 확인
      const cached = getDailyCache<HistoryEntry[]>(cacheKey)
      if (cached) return cached

      try {
        // 2. API 호출
        const dates = getDatesForPeriod(period)
        const results = await Promise.all(
          dates.map((date) => fetchDayHistory(date, exchangeRate))
        )
        const entries = results.filter((r): r is HistoryEntry => r !== null)
        setDailyCache(cacheKey, entries)
        setPersistentCache(cacheKey, entries)
        return entries
      } catch {
        // 3. API 실패 → 마지막으로 수신한 데이터로 폴백
        const lastKnown = getPersistentCache<HistoryEntry[]>(cacheKey)
        if (lastKnown) return lastKnown.data
        throw new Error('금시세 히스토리를 불러올 수 없습니다.')
      }
    },
    staleTime: 24 * 60 * 60 * 1000,
    enabled: exchangeRate > 0,
  })
}
