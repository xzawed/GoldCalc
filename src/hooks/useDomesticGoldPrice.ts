import { useQuery } from '@tanstack/react-query'
import { fetchDomesticGold } from '@/utils/fetchWithFailover'
import { getDailyCache, setDailyCache } from '@/utils/dailyCache'
import { getPersistentCache, setPersistentCache } from '@/utils/persistentCache'
import type { DomesticGoldPriceResponse } from '@/types/gold'

interface DataGoKrItem {
  basDt: string
  itmsNm: string
  clpr: string
  mkp: string
  hipr: string
  lopr: string
  vs: string
  fltRt: string
  trqu: string
  trPrc: string
}

interface DataGoKrResponse {
  response: {
    header: { resultCode: string; resultMsg: string }
    body: {
      totalCount: number
      pageNo: number
      numOfRows: number
      items: { item: DataGoKrItem[] }
    }
  }
}

export interface DomesticGoldPriceResult extends DomesticGoldPriceResponse {
  isStale?: boolean
  cachedAt?: string
}

function parseResponse(data: DataGoKrResponse): DomesticGoldPriceResponse | null {
  const items = data.response?.body?.items?.item
  if (!items || items.length === 0) return null

  const latest = items[0]
  const priceKRW = Number(latest.clpr) || 0
  if (!priceKRW) return null

  return {
    priceKRW,
    changePercent: Number(latest.fltRt) || 0,
    volume: Number(latest.trqu) || undefined,
    updatedAt: `${latest.basDt.slice(0, 4)}-${latest.basDt.slice(4, 6)}-${latest.basDt.slice(6, 8)}`,
  }
}

const CACHE_KEY = 'domesticgoldprice'

export function useDomesticGoldPrice() {
  return useQuery({
    queryKey: ['domesticGoldPrice'],
    queryFn: async (): Promise<DomesticGoldPriceResult> => {
      // 1. 당일 캐시 확인
      const cached = getDailyCache<DomesticGoldPriceResult>(CACHE_KEY)
      if (cached) return cached

      try {
        // 2. API 호출 (Railway 우선, 장애 시 Supabase 자동 페일오버)
        const { data } = await fetchDomesticGold<DataGoKrResponse>(
          '?numOfRows=1&resultType=json',
        )
        const result = parseResponse(data)
        if (!result) throw new Error('국내 금시세 데이터를 파싱할 수 없습니다.')
        setDailyCache(CACHE_KEY, result)
        setPersistentCache(CACHE_KEY, result)
        return result
      } catch {
        // 3. API 실패 → 마지막으로 수신한 데이터로 폴백
        const lastKnown = getPersistentCache<DomesticGoldPriceResult>(CACHE_KEY)
        if (lastKnown) {
          return { ...lastKnown.data, isStale: true, cachedAt: lastKnown.savedAt }
        }
        throw new Error('국내 금시세 데이터를 불러올 수 없습니다.')
      }
    },
    staleTime: 5 * 60_000,
    retry: 1,
  })
}
