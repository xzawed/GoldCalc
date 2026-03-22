import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/utils/api'
import type { DomesticGoldPriceResponse } from '@/types/gold'

// Vercel Serverless Function 프록시 경로
const PROXY_URL = '/api/domestic-gold'

// data.go.kr getGoldPriceInfo 실제 응답 스키마
interface DataGoKrItem {
  basDt: string       // 기준일자 (YYYYMMDD)
  itmsNm: string      // 종목명
  clpr: string        // 종가 (원/g)
  mkp: string         // 시가
  hipr: string        // 고가
  lopr: string        // 저가
  vs: string          // 전일 대비 등락
  fltRt: string       // 등락률 (%)
  trqu: string        // 거래량
  trPrc: string       // 거래대금
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

function parseResponse(data: DataGoKrResponse): DomesticGoldPriceResponse | null {
  const items = data.response?.body?.items?.item
  if (!items || items.length === 0) return null

  // 최신 날짜 데이터 (첫 번째 항목)
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

export function useDomesticGoldPrice() {
  return useQuery({
    queryKey: ['domesticGoldPrice'],
    queryFn: async () => {
      const data = await apiFetch<DataGoKrResponse>(
        `${PROXY_URL}?numOfRows=1&resultType=json`,
      )
      const result = parseResponse(data)
      if (!result) throw new Error('국내 금시세 데이터를 파싱할 수 없습니다.')
      return result
    },
    staleTime: 5 * 60_000,
    refetchInterval: 10 * 60_000,
    retry: 1,
  })
}
