import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/utils/api'
import { calcPricePerGram } from '@/utils/metalCalc'
import { getDailyCache, setDailyCache } from '@/utils/dailyCache'
import { getPersistentCache, setPersistentCache } from '@/utils/persistentCache'
import { format, subDays } from 'date-fns'
import type { Period, HistoryEntry } from '@/types/gold'

const GOLD_API_COM_URL = 'https://api.gold-api.com'

interface GoldApiComHistoryRaw {
  name: string
  price: number
  symbol: string
  updatedAt: string
}

function getDatesForPeriod(period: Period): string[] {
  const today = new Date()
  const config: Record<Period, { days: number; step: number }> = {
    '1W': { days: 7, step: 1 },
    '1M': { days: 30, step: 3 },
    '3M': { days: 90, step: 7 },
    '1Y': { days: 365, step: 14 },
  }
  const { days, step } = config[period]
  const dates: string[] = []
  for (let i = days; i >= 1; i -= step) {
    dates.push(format(subDays(today, i), 'yyyy-MM-dd'))
  }
  return dates
}

async function fetchDayHistory(
  date: string,
  exchangeRate: number,
): Promise<HistoryEntry | null> {
  try {
    const data = await apiFetch<GoldApiComHistoryRaw>(
      `${GOLD_API_COM_URL}/price/XAG?date=${date}`,
    )
    const priceUSD = data.price
    if (!priceUSD) return null
    return {
      date,
      priceUSD,
      priceKRW: Math.round(calcPricePerGram(priceUSD, exchangeRate) * 0.999),
    }
  } catch {
    return null
  }
}

export function useSilverHistory(period: Period, exchangeRate: number) {
  return useQuery({
    queryKey: ['silverHistory', period],
    queryFn: async (): Promise<HistoryEntry[]> => {
      const cacheKey = `silverhistory:${period}`

      // 1. 당일 캐시 확인
      const cached = getDailyCache<HistoryEntry[]>(cacheKey)
      if (cached) return cached

      try {
        // 2. API 호출
        const dates = getDatesForPeriod(period)
        const results = await Promise.all(
          dates.map((date) => fetchDayHistory(date, exchangeRate)),
        )
        const entries = results.filter((r): r is HistoryEntry => r !== null)
        setDailyCache(cacheKey, entries)
        setPersistentCache(cacheKey, entries)
        return entries
      } catch {
        // 3. API 실패 → 마지막으로 수신한 데이터로 폴백
        const lastKnown = getPersistentCache<HistoryEntry[]>(cacheKey)
        if (lastKnown) return lastKnown.data
        throw new Error('은시세 히스토리를 불러올 수 없습니다.')
      }
    },
    staleTime: 24 * 60 * 60 * 1000,
    enabled: exchangeRate > 0,
  })
}
