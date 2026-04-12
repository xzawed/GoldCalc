import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/utils/api'
import { getDailyCache, setDailyCache } from '@/utils/dailyCache'
import { getPersistentCache, setPersistentCache } from '@/utils/persistentCache'

interface GoldAPIRaw {
  price: number
  chp: number
  timestamp: number
}

export interface GoldPriceResult {
  priceUSD: number
  changePercent: number
  updatedAt: string
  isStale?: boolean  // true = API 한도 초과로 이전 데이터 반환
  cachedAt?: string  // 마지막 API 수신 시각
}

const CACHE_KEY = 'goldprice'

interface UseGoldPriceOptions {
  enabled?: boolean
}

export function useGoldPrice({ enabled = true }: UseGoldPriceOptions = {}) {
  return useQuery({
    queryKey: ['goldPrice'],
    enabled,
    queryFn: async (): Promise<GoldPriceResult> => {
      // 1. 당일 캐시 확인
      const cached = getDailyCache<GoldPriceResult>(CACHE_KEY)
      if (cached) return cached

      try {
        // 2. API 호출
        const data = await apiFetch<GoldAPIRaw>('/api/gold-price')
        const result: GoldPriceResult = {
          priceUSD: data.price,
          changePercent: data.chp,
          updatedAt: new Date(data.timestamp * 1000).toISOString(),
        }
        setDailyCache(CACHE_KEY, result)
        setPersistentCache(CACHE_KEY, result)
        return result
      } catch (error) {
        console.error('[useGoldPrice] API 호출 실패, 영속 캐시로 폴백:', error)
        // 3. API 실패 → 마지막으로 수신한 데이터로 폴백
        const lastKnown = getPersistentCache<GoldPriceResult>(CACHE_KEY)
        if (lastKnown) {
          return { ...lastKnown.data, isStale: true, cachedAt: lastKnown.savedAt }
        }
        throw new Error('금시세 데이터를 불러올 수 없습니다.')
      }
    },
    staleTime: 60 * 60 * 1000,
    refetchInterval: false,
    retry: 1,
  })
}
