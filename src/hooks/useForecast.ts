import { useMemo } from 'react'
import { computeForecast, getTrend } from '@/utils/forecast'
import type { HistoryEntry, ForecastPoint, ForecastDays } from '@/types/gold'

export function useForecast(history: HistoryEntry[], days: ForecastDays) {
  const forecastPoints = useMemo<ForecastPoint[]>(() => {
    if (history.length < 5) return []
    return computeForecast(history, days)
  }, [history, days])

  const trend = useMemo(() => getTrend(history), [history])

  return { forecastPoints, trend }
}
