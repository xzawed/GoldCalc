import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
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
import { cn } from '@/lib/utils'
import type { Metal } from '@/types/gold'
import { PERIOD_OPTIONS } from '@/types/gold'

interface HistorySectionProps {
  metal?: Metal
}

function HistoryContent({ period, metal }: { period: Period; metal: Metal }) {
  const { data: rateData } = useExchangeRate()
  const exchangeRate = rateData?.exchangeRate ?? 0

  const goldHistory = useGoldHistory(period, exchangeRate, { enabled: metal === 'gold' })
  const silverHistory = useSilverHistory(period, exchangeRate, { enabled: metal === 'silver' })

  const query = metal === 'gold' ? goldHistory : silverHistory
  const { data: entries, isLoading, isError } = query

  if (isLoading) return <ChartSkeleton />
  if (isError || !entries) return <ErrorAlert />
  if (entries.length === 0) return <p className="text-muted-foreground text-center py-8">데이터가 없습니다.</p>

  const summary = calcPeriodSummary(entries)
  const metalName = METAL_LABELS[metal]
  const metalColor = metal === 'gold' ? '#f5c518' : '#94a3b8'

  return (
    <div className="space-y-5">
      {summary && <PriceSummary summary={summary} />}
      <PriceChart entries={entries} metalName={metalName} metalColor={metalColor} />
      <PriceTable entries={entries} metalName={metalName} />
    </div>
  )
}

export default function HistorySection({ metal = 'gold' }: HistorySectionProps) {
  const [period, setPeriod] = useState<Period>('1W')
  const metalName = METAL_LABELS[metal]
  const isGold = metal === 'gold'

  return (
    <section aria-labelledby="history-title" data-testid="history-section">
      <Card className={isGold ? 'card-glow-gold' : 'card-glow-silver'}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle id="history-title" className="flex items-center gap-2 text-base">
              <span
                className={`w-1.5 h-5 rounded-full ${isGold ? 'bg-amber-400' : 'bg-slate-400'}`}
                aria-hidden="true"
              />
              {metalName} 날짜별 시세 변동
            </CardTitle>
            {/* 기간 선택 탭 */}
            <div
              role="tablist"
              aria-label="기간 선택"
              className="inline-flex items-center gap-0.5 p-1 rounded-lg bg-muted/50 border border-border/40"
            >
              {PERIOD_OPTIONS.map(({ key, label }) => (
                <button
                  key={key}
                  id={`history-tab-${key}`}
                  role="tab"
                  aria-selected={period === key}
                  aria-controls="history-tabpanel"
                  data-state={period === key ? 'active' : 'inactive'}
                  onClick={() => setPeriod(key)}
                  data-testid={`period-tab-${key}`}
                  className={cn(
                    'px-3 py-1 rounded-md text-xs font-medium transition-all duration-150',
                    period === key
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent
          id="history-tabpanel"
          role="tabpanel"
          aria-labelledby={`history-tab-${period}`}
        >
          <HistoryContent period={period} metal={metal} />
        </CardContent>
      </Card>
    </section>
  )
}
