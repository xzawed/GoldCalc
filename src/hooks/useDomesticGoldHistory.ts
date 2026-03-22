import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/utils/api'
import { format, subDays } from 'date-fns'
import type { Period, DomesticHistoryEntry } from '@/types/gold'

const PROXY_URL = '/api/domestic-gold'

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
      items: {
        item: DataGoKrItem[]
      }
    }
  }
}

// 기간별 조회 일수 (영업일 기준이므로 넉넉하게)
const PERIOD_CONFIG: Record<Period, { daysBack: number; numOfRows: number }> = {
  '1W': { daysBack: 14, numOfRows: 7 },
  '1M': { daysBack: 45, numOfRows: 30 },
  '3M': { daysBack: 120, numOfRows: 90 },
  '1Y': { daysBack: 400, numOfRows: 365 },
}

export function useDomesticGoldHistory(period: Period) {
  return useQuery({
    queryKey: ['domesticGoldHistory', period],
    queryFn: async () => {
      const { daysBack, numOfRows } = PERIOD_CONFIG[period]
      const today = new Date()
      const beginDate = format(subDays(today, daysBack), 'yyyyMMdd')
      const endDate = format(today, 'yyyyMMdd')

      const data = await apiFetch<DataGoKrResponse>(
        `${PROXY_URL}?numOfRows=${numOfRows}&beginBasDt=${beginDate}&endBasDt=${endDate}&resultType=json`,
      )

      const items = data.response?.body?.items?.item
      if (!items || items.length === 0) return []

      const entries: DomesticHistoryEntry[] = items
        .filter((item) => item.clpr && item.basDt)
        .map((item) => ({
          date: `${item.basDt.slice(0, 4)}-${item.basDt.slice(4, 6)}-${item.basDt.slice(6, 8)}`,
          priceKRW: Number(item.clpr),
          volume: Number(item.trqu) || undefined,
        }))
        .reverse() // 최신순 → 과거순 정렬 (차트용)

      return entries
    },
    staleTime: 24 * 60 * 60 * 1000,
    retry: 1,
  })
}
