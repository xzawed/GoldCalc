import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ErrorAlert } from '@/components/common/ErrorAlert'
import { ChartSkeleton } from './ChartSkeleton'
import { PriceChart } from './PriceChart'
import { PriceTable } from './PriceTable'
import { PriceSummary } from './PriceSummary'
import { useGoldHistory } from '@/hooks/useGoldHistory'
import { useSilverHistory } from '@/hooks/useSilverHistory'
import { useExchangeRate } from '@/hooks/useExchangeRate'
import { calcPeriodSummary } from '@/utils/historyCalc'
import { METAL_LABELS } from '@/utils/metalCalc'
import type { Period, Metal } from '@/types/gold'

const PERIOD_LABELS: Record<Period, string> = {
  '1W': '1주',
  '1M': '1개월',
  '3M': '3개월',
  '1Y': '1년',
}

interface HistorySectionProps {
  metal?: Metal
}

function HistoryContent({ period, metal }: { period: Period; metal: Metal }) {
  const { data: rateData } = useExchangeRate()
  const exchangeRate = rateData?.exchangeRate ?? 0

  const goldHistory = useGoldHistory(period, exchangeRate)
  const silverHistory = useSilverHistory(period, exchangeRate)

  const query = metal === 'gold' ? goldHistory : silverHistory
  const { data: entries, isLoading, isError } = query

  if (isLoading) return <ChartSkeleton />
  if (isError || !entries) return <ErrorAlert />
  if (entries.length === 0) return <p className="text-muted-foreground text-center py-8">데이터가 없습니다.</p>

  const summary = calcPeriodSummary(entries)
  const metalName = METAL_LABELS[metal]

  return (
    <div className="space-y-4">
      {summary && <PriceSummary summary={summary} />}
      <PriceChart entries={entries} metalName={metalName} />
      <PriceTable entries={entries} metalName={metalName} />
    </div>
  )
}

export default function HistorySection({ metal = 'gold' }: HistorySectionProps) {
  const [period, setPeriod] = useState<Period>('1W')
  const metalName = METAL_LABELS[metal]

  return (
    <section aria-labelledby="history-title" data-testid="history-section">
      <Card>
        <CardHeader>
          <CardTitle id="history-title">{metalName} 날짜별 시세 변동</CardTitle>
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
                {period === p && <HistoryContent period={p} metal={metal} />}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </section>
  )
}
