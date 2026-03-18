import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ErrorAlert } from '@/components/common/ErrorAlert'
import { ChartSkeleton } from './ChartSkeleton'
import { PriceChart } from './PriceChart'
import { PriceTable } from './PriceTable'
import { PriceSummary } from './PriceSummary'
import { useGoldHistory } from '@/hooks/useGoldHistory'
import { useExchangeRate } from '@/hooks/useExchangeRate'
import { calcPeriodSummary } from '@/utils/historyCalc'
import type { Period } from '@/types/gold'

const PERIOD_LABELS: Record<Period, string> = {
  '1W': '1주',
  '1M': '1개월',
  '3M': '3개월',
  '1Y': '1년',
}

function HistoryContent({ period }: { period: Period }) {
  const { data: rateData } = useExchangeRate()
  const { data: entries, isLoading, isError } = useGoldHistory(period, rateData?.exchangeRate ?? 0)

  if (isLoading) return <ChartSkeleton />
  if (isError || !entries) return <ErrorAlert />
  if (entries.length === 0) return <p className="text-muted-foreground text-center py-8">데이터가 없습니다.</p>

  const summary = calcPeriodSummary(entries)

  return (
    <div className="space-y-4">
      {summary && <PriceSummary summary={summary} />}
      <PriceChart entries={entries} />
      <PriceTable entries={entries} />
    </div>
  )
}

export default function HistorySection() {
  const [period, setPeriod] = useState<Period>('1W')

  return (
    <section aria-labelledby="history-title" data-testid="history-section">
      <Card>
        <CardHeader>
          <CardTitle id="history-title">날짜별 시세 변동</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)}>
            <TabsList className="grid grid-cols-4 w-full mb-4" aria-label="기간 선택">
              {(Object.entries(PERIOD_LABELS) as [Period, string][]).map(([p, label]) => (
                <TabsTrigger key={p} value={p} data-testid={`period-tab-${p}`}>{label}</TabsTrigger>
              ))}
            </TabsList>
            {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
              <TabsContent key={p} value={p}>
                {period === p && <HistoryContent period={p} />}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </section>
  )
}
