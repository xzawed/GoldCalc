import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/utils/api'
import { getDailyCache, setDailyCache } from '@/utils/dailyCache'
import { getPersistentCache, setPersistentCache } from '@/utils/persistentCache'

interface ExchangeRateRaw {
  result: string
  conversion_rates: { KRW: number }
}

export interface ExchangeRateResult {
  exchangeRate: number
  isStale?: boolean
  cachedAt?: string
}

const CACHE_KEY = 'exchangerate'

export function useExchangeRate() {
  return useQuery({
    queryKey: ['exchangeRate'],
    queryFn: async (): Promise<ExchangeRateResult> => {
      // 1. 당일 캐시 확인
      const cached = getDailyCache<ExchangeRateResult>(CACHE_KEY)
      if (cached) return cached

      try {
        // 2. API 호출
        const data = await apiFetch<ExchangeRateRaw>(
          `${import.meta.env.VITE_EXCHANGE_RATE_API_URL}/${import.meta.env.VITE_EXCHANGE_RATE_API_KEY}/latest/USD`
        )
        const result: ExchangeRateResult = { exchangeRate: data.conversion_rates.KRW }
        setDailyCache(CACHE_KEY, result)
        setPersistentCache(CACHE_KEY, result)
        return result
      } catch (error) {
        console.error('[useExchangeRate] API 호출 실패, 영속 캐시로 폴백:', error)
        // 3. API 실패 → 마지막으로 수신한 환율로 폴백
        const lastKnown = getPersistentCache<ExchangeRateResult>(CACHE_KEY)
        if (lastKnown) {
          return { ...lastKnown.data, isStale: true, cachedAt: lastKnown.savedAt }
        }
        throw new Error('환율 데이터를 불러올 수 없습니다.')
      }
    },
    staleTime: 60 * 60 * 1000,
    refetchInterval: false,
    retry: 1,
  })
}
