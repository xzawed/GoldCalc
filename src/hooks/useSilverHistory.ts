import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/utils/api'
import { calcPricePerGram } from '@/utils/metalCalc'
import { format, subDays } from 'date-fns'
import type { Period, HistoryEntry } from '@/types/gold'

// gold-api.com 무료 API (히스토리: 10회/시간 제한)
const GOLD_API_COM_URL = 'https://api.gold-api.com'

// 히스토리 응답도 현재가와 동일 스키마로 예상
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
    queryFn: async () => {
      const dates = getDatesForPeriod(period)
      // gold-api.com 히스토리는 10회/시간 제한 → 배치 크기 제한
      const results = await Promise.all(
        dates.map((date) => fetchDayHistory(date, exchangeRate)),
      )
      return results.filter((r): r is HistoryEntry => r !== null)
    },
    staleTime: 24 * 60 * 60 * 1000,
    enabled: exchangeRate > 0,
  })
}
