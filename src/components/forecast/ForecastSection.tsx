import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorAlert } from '@/components/common/ErrorAlert'
import { ForecastChart } from './ForecastChart'
import { MarketSignals } from './MarketSignals'
import { TrendBadge } from './TrendBadge'
import { Disclaimer } from './Disclaimer'
import { useGoldHistory } from '@/hooks/useGoldHistory'
import { useSilverHistory } from '@/hooks/useSilverHistory'
import { useExchangeRate } from '@/hooks/useExchangeRate'
import { useMarketSignals } from '@/hooks/useMarketSignals'
import { useForecast } from '@/hooks/useForecast'
import { METAL_LABELS } from '@/utils/metalCalc'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import type { ForecastDays, Metal } from '@/types/gold'

interface ForecastSectionProps {
  metal?: Metal
}

function ForecastContent({ days, metal }: { days: ForecastDays; metal: Metal }) {
  const { data: rateData } = useExchangeRate()
  const exchangeRate = rateData?.exchangeRate ?? 0

  const goldHistory = useGoldHistory('3M', exchangeRate)
  const silverHistory = useSilverHistory('3M', exchangeRate)

  const query = metal === 'gold' ? goldHistory : silverHistory
  const { data: history = [], isLoading, isError } = query
  const { forecastPoints, trend } = useForecast(history, days)
  const { data: signals } = useMarketSignals()

  const todayDate = format(new Date(), 'yyyy-MM-dd')
  const metalColor = metal === 'gold' ? '#f5c518' : '#94a3b8'

  if (isLoading) return <Skeleton className="h-64 w-full rounded-xl" />
  if (isError) return <ErrorAlert />

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">현재 트렌드</span>
        <TrendBadge trend={trend} />
      </div>
      {forecastPoints.length > 0 && (
        <ForecastChart points={forecastPoints} todayDate={todayDate} metalColor={metalColor} />
      )}
      {signals && signals.length > 0 && (
        <div>
          <h3 className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">주요 시장 신호</h3>
          <MarketSignals signals={signals} />
        </div>
      )}
    </div>
  )
}

export default function ForecastSection({ metal = 'gold' }: ForecastSectionProps) {
  const [days, setDays] = useState<ForecastDays>(7)
  const metalName = METAL_LABELS[metal]
  const isGold = metal === 'gold'

  return (
    <section aria-labelledby="forecast-title" data-testid="forecast-section">
      <Card className={isGold ? 'card-glow-gold' : 'card-glow-silver'}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle id="forecast-title" className="flex items-center gap-2 text-base">
              <span
                className={`w-1.5 h-5 rounded-full ${isGold ? 'bg-amber-400' : 'bg-slate-400'}`}
                aria-hidden="true"
              />
              {metalName}시세 예측
            </CardTitle>
            <div
              role="tablist"
              aria-label="예측 기간 선택"
              className="inline-flex items-center gap-0.5 p-1 rounded-lg bg-muted/50 border border-border/40"
            >
              {([7, 30] as ForecastDays[]).map((d) => (
                <button
                  key={d}
                  role="tab"
                  aria-selected={days === d}
                  onClick={() => setDays(d)}
                  data-testid={`forecast-tab-${d}`}
                  className={cn(
                    'px-3 py-1 rounded-md text-xs font-medium transition-all duration-150',
                    days === d
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {d}일
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <ForecastContent days={days} metal={metal} />
          <Disclaimer metal={metal} />
        </CardContent>
      </Card>
    </section>
  )
}
