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
    const data = await apiFetch<FREDResponse>('/api/market-signals/treasury')
    const latest = data.observations[0]
    const value = parseFloat(latest?.value ?? '0')
    return {
      name: '미국 국채 10년',
      value,
      trend: value > 4.5 ? 'up' : value < 3.5 ? 'down' : 'neutral',
      description: `${value.toFixed(2)}% — 금리 상승 시 금 약세 압력`,
    }
  } catch (error) {
    console.warn('[useMarketSignals] 미국 국채 10년 조회 실패:', error)
    return { name: '미국 국채 10년', value: 0, trend: 'neutral', description: '데이터 없음' }
  }
}

async function fetchVIX(): Promise<MarketSignal> {
  try {
    const data = await apiFetch<AlphaVantageQuote>('/api/market-signals/vix')
    const value = parseFloat(data['Global Quote']?.['05. price'] ?? '0')
    const changeStr = data['Global Quote']?.['10. change percent'] ?? '0%'
    const change = parseFloat(changeStr.replace('%', ''))
    return {
      name: 'VIX (공포지수)',
      value,
      trend: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral',
      description: `${value.toFixed(2)} — 변동성 상승 시 안전자산 선호`,
    }
  } catch (error) {
    console.warn('[useMarketSignals] VIX 조회 실패:', error)
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
