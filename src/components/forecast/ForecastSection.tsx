import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorAlert } from '@/components/common/ErrorAlert'
import { ForecastChart } from './ForecastChart'
import { MarketSignals } from './MarketSignals'
import { TrendBadge } from './TrendBadge'
import { Disclaimer } from './Disclaimer'
import { useGoldHistory } from '@/hooks/useGoldHistory'
import { useExchangeRate } from '@/hooks/useExchangeRate'
import { useMarketSignals } from '@/hooks/useMarketSignals'
import { useForecast } from '@/hooks/useForecast'
import { format } from 'date-fns'
import type { ForecastDays } from '@/types/gold'

function ForecastContent({ days }: { days: ForecastDays }) {
  const { data: rateData } = useExchangeRate()
  const { data: history = [], isLoading, isError } = useGoldHistory('3M', rateData?.exchangeRate ?? 0)
  const { forecastPoints, trend } = useForecast(history, days)
  const { data: signals } = useMarketSignals()

  const todayDate = format(new Date(), 'yyyy-MM-dd')

  if (isLoading) return <Skeleton className="h-64 w-full" />
  if (isError) return <ErrorAlert />

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">현재 트렌드:</span>
        <TrendBadge trend={trend} />
      </div>
      {forecastPoints.length > 0 && (
        <ForecastChart points={forecastPoints} todayDate={todayDate} />
      )}
      {signals && signals.length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-2">주요 시장 신호</h3>
          <MarketSignals signals={signals} />
        </div>
      )}
    </div>
  )
}

export default function ForecastSection() {
  const [days, setDays] = useState<ForecastDays>(7)

  return (
    <section aria-labelledby="forecast-title" data-testid="forecast-section">
      <Card>
        <CardHeader>
          <CardTitle id="forecast-title">금시세 예측</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={String(days)} onValueChange={(v) => setDays(Number(v) as ForecastDays)}>
            <TabsList className="grid grid-cols-2 w-48" aria-label="예측 기간 선택">
              <TabsTrigger value="7" data-testid="forecast-tab-7">7일</TabsTrigger>
              <TabsTrigger value="30" data-testid="forecast-tab-30">30일</TabsTrigger>
            </TabsList>
            <TabsContent value="7">
              <ForecastContent days={7} />
            </TabsContent>
            <TabsContent value="30">
              <ForecastContent days={30} />
            </TabsContent>
          </Tabs>
          <Disclaimer />
        </CardContent>
      </Card>
    </section>
  )
}
