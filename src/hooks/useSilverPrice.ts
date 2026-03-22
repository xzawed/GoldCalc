import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/utils/api'

// gold-api.com 무료 API (인증 불필요, CORS 지원)
const GOLD_API_COM_URL = 'https://api.gold-api.com'

// 실제 응답 스키마 (2026-03-22 확인)
// {"name":"Silver","price":67.938004,"symbol":"XAG","updatedAt":"2026-03-22T13:09:10Z","updatedAtReadable":"a few seconds ago"}
interface GoldApiComPriceRaw {
  name: string
  price: number
  symbol: string
  updatedAt: string           // ISO 8601
  updatedAtReadable: string
}

export function useSilverPrice() {
  return useQuery({
    queryKey: ['silverPrice'],
    queryFn: async () => {
      const data = await apiFetch<GoldApiComPriceRaw>(
        `${GOLD_API_COM_URL}/price/XAG`,
      )
      return {
        priceUSD: data.price,
        changePercent: 0,       // API에서 등락률 미제공
        updatedAt: data.updatedAt,
      }
    },
    staleTime: 60_000,
    refetchInterval: 5 * 60_000,
  })
}
