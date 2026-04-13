import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/utils/api'
import { getDailyCache, setDailyCache } from '@/utils/dailyCache'
import { getPersistentCache, setPersistentCache } from '@/utils/persistentCache'

interface GoldApiPriceRaw {
  price: number
  chp: number
  timestamp: number
}

export interface SilverPriceResult {
  priceUSD: number
  changePercent: number
  updatedAt: string
  isStale?: boolean
  cachedAt?: string
}

const CACHE_KEY = 'silverprice'

interface UseSilverPriceOptions {
  enabled?: boolean
}

export function useSilverPrice({ enabled = true }: UseSilverPriceOptions = {}) {
  return useQuery({
    queryKey: ['silverPrice'],
    enabled,
    queryFn: async (): Promise<SilverPriceResult> => {
      // 1. 당일 캐시 확인
      const cached = getDailyCache<SilverPriceResult>(CACHE_KEY)
      if (cached) return cached

      try {
        // 2. API 호출 (서버 프록시 경유)
        const data = await apiFetch<GoldApiPriceRaw>('/api/silver-price')
        const result: SilverPriceResult = {
          priceUSD: data.price,
          changePercent: data.chp ?? 0,
          updatedAt: new Date(data.timestamp * 1000).toISOString(),
        }
        setDailyCache(CACHE_KEY, result)
        setPersistentCache(CACHE_KEY, result)
        return result
      } catch (error) {
        console.error('[useSilverPrice] API 호출 실패, 영속 캐시로 폴백:', error)
        // 3. API 실패 → 마지막으로 수신한 데이터로 폴백
        const lastKnown = getPersistentCache<SilverPriceResult>(CACHE_KEY)
        if (lastKnown) {
          return { ...lastKnown.data, isStale: true, cachedAt: lastKnown.savedAt }
        }
        throw new Error('은시세 데이터를 불러올 수 없습니다.')
      }
    },
    staleTime: 60 * 60 * 1000,
    refetchInterval: false,
    retry: 1,
  })
}
