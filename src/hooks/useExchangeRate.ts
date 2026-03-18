import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/utils/api'

interface ExchangeRateRaw {
  result: string
  conversion_rates: { KRW: number }
}

export function useExchangeRate() {
  return useQuery({
    queryKey: ['exchangeRate'],
    queryFn: async () => {
      const data = await apiFetch<ExchangeRateRaw>(
        `${import.meta.env.VITE_EXCHANGE_RATE_API_URL}/${import.meta.env.VITE_EXCHANGE_RATE_API_KEY}/latest/USD`
      )
      return { exchangeRate: data.conversion_rates.KRW }
    },
    staleTime: 60_000,
    refetchInterval: 5 * 60_000,
  })
}
