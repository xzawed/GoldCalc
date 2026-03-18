import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/utils/api'
import type { MarketSignal } from '@/types/gold'

interface FREDResponse {
  observations: Array<{ date: string; value: string }>
}

interface AlphaVantageQuote {
  'Global Quote': {
    '05. price': string
    '10. change percent': string
  }
}

async function fetchTreasuryYield(): Promise<MarketSignal> {
  try {
    const key = import.meta.env.VITE_FRED_API_KEY
    if (!key) throw new Error('No FRED API key')
    const data = await apiFetch<FREDResponse>(
      `https://api.stlouisfed.org/fred/series/observations?series_id=DGS10&api_key=${key}&file_type=json&limit=1&sort_order=desc`
    )
    const latest = data.observations[0]
    const value = parseFloat(latest?.value ?? '0')
    return {
      name: '미국 국채 10년',
      value,
      trend: value > 4.5 ? 'up' : value < 3.5 ? 'down' : 'neutral',
      description: `${value.toFixed(2)}% — 금리 상승 시 금 약세 압력`,
    }
  } catch {
    return { name: '미국 국채 10년', value: 0, trend: 'neutral', description: '데이터 없음' }
  }
}

async function fetchVIX(): Promise<MarketSignal> {
  try {
    const key = import.meta.env.VITE_ALPHA_VANTAGE_KEY
    if (!key) throw new Error('No Alpha Vantage key')
    const data = await apiFetch<AlphaVantageQuote>(
      `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=VIX&apikey=${key}`
    )
    const value = parseFloat(data['Global Quote']?.['05. price'] ?? '0')
    const changeStr = data['Global Quote']?.['10. change percent'] ?? '0%'
    const change = parseFloat(changeStr.replace('%', ''))
    return {
      name: 'VIX (공포지수)',
      value,
      trend: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral',
      description: `${value.toFixed(2)} — 변동성 상승 시 안전자산 선호`,
    }
  } catch {
    return { name: 'VIX (공포지수)', value: 0, trend: 'neutral', description: '데이터 없음' }
  }
}

export function useMarketSignals() {
  return useQuery<MarketSignal[]>({
    queryKey: ['marketSignals'],
    queryFn: () => Promise.all([fetchTreasuryYield(), fetchVIX()]),
    staleTime: 24 * 60 * 60 * 1000,
    retry: 1,
  })
}
