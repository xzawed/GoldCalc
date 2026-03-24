import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/utils/api'
import { getDailyCache, setDailyCache } from '@/utils/dailyCache'
import { getPersistentCache, setPersistentCache } from '@/utils/persistentCache'

const GOLD_API_COM_URL = 'https://api.gold-api.com'

interface GoldApiComPriceRaw {
  name: string
  price: number
  symbol: string
  updatedAt: string
  updatedAtReadable: string
}

export interface SilverPriceResult {
  priceUSD: number
  changePercent: number
  updatedAt: string
  isStale?: boolean
  cachedAt?: string
}

const CACHE_KEY = 'silverprice'

export function useSilverPrice() {
  return useQuery({
    queryKey: ['silverPrice'],
    queryFn: async (): Promise<SilverPriceResult> => {
      // 1. 당일 캐시 확인
      const cached = getDailyCache<SilverPriceResult>(CACHE_KEY)
      if (cached) return cached

      try {
        // 2. API 호출
        const data = await apiFetch<GoldApiComPriceRaw>(
          `${GOLD_API_COM_URL}/price/XAG`,
        )
        const result: SilverPriceResult = {
          priceUSD: data.price,
          changePercent: 0,
          updatedAt: data.updatedAt,
        }
        setDailyCache(CACHE_KEY, result)
        setPersistentCache(CACHE_KEY, result)
        return result
      } catch {
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
