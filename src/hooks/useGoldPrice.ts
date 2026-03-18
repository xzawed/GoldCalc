import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/utils/api'

interface GoldAPIRaw {
  price: number
  chp: number
  timestamp: number
}

export function useGoldPrice() {
  return useQuery({
    queryKey: ['goldPrice'],
    queryFn: async () => {
      const data = await apiFetch<GoldAPIRaw>(
        `${import.meta.env.VITE_GOLD_API_URL}/XAU/USD`,
        { 'x-access-token': import.meta.env.VITE_GOLD_API_KEY }
      )
      return {
        priceUSD: data.price,
        changePercent: data.chp,
        updatedAt: new Date(data.timestamp * 1000).toISOString(),
      }
    },
    staleTime: 60_000,
    refetchInterval: 5 * 60_000,
  })
}
