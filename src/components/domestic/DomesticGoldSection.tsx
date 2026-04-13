import { useState, useMemo } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorAlert } from '@/components/common/ErrorAlert'
import { ChartSkeleton } from '@/components/history/ChartSkeleton'
import { UnitSelector } from '@/components/calculator/UnitSelector'
import { PuritySelector } from '@/components/calculator/PuritySelector'
import { useDomesticGoldPrice } from '@/hooks/useDomesticGoldPrice'
import { useDomesticGoldHistory } from '@/hooks/useDomesticGoldHistory'
import { cn } from '@/lib/utils'
import {
  formatKRW, formatDate,
  getChangeColor, getChangeIcon, formatChangeRate,
} from '@/utils/format'
import { weightToGrams, PURITY_RATIO, DON_TO_G } from '@/utils/metalCalc'
import {
  ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { WeightUnit, GoldPurity, Period, DomesticHistoryEntry } from '@/types/gold'
import { getSupportedPeriodOptions } from '@/types/gold'

// ─── 계산기 ───

function DomesticCalculator() {
  const [weight, setWeight] = useState<number>(0)
  const [unit, setUnit] = useState<WeightUnit>('don')
  const [purity, setPurity] = useState<GoldPurity>('24K')

  const { data, isLoading, isError } = useDomesticGoldPrice()

  const handleWeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value)
    setWeight(isNaN(val) ? 0 : val)
  }

  if (isLoading) {
    return (
      <div className="space-y-4" data-testid="domestic-calculator-skeleton">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  if (isError || !data) {
    return <ErrorAlert message="국내 금시세를 불러오지 못했습니다. API 키 설정을 확인해 주세요." />
  }

  const pricePerGram = data.priceKRW
  const grams = weightToGrams(weight, unit)
  const totalKRW = Math.round(pricePerGram * grams * PURITY_RATIO[purity])
  const pricePerGramKRW = Math.round(pricePerGram * PURITY_RATIO[purity])
  const pricePerDonKRW = Math.round(pricePerGram * DON_TO_G * PURITY_RATIO[purity])
  const unitLabel = unit === 'g' ? 'g' : unit === 'don' ? '돈' : '냥'

  return (
    <div className="space-y-4" data-testid="domestic-calculator">
      <div className="space-y-2">
        <label htmlFor="domestic-weight-input" className="text-sm font-medium">무게 입력</label>
        <Input
          id="domestic-weight-input"
          type="number"
          min={0}
          step={0.1}
          placeholder="무게를 입력하세요"
          value={weight || ''}
          onChange={handleWeightChange}
          data-testid="domestic-weight-input"
          aria-label="금 무게 입력"
        />
      </div>
      <div className="space-y-2">
        <span id="domestic-gold-unit-label" className="text-sm font-medium block">단위 선택</span>
        <UnitSelector value={unit} onChange={setUnit} labelId="domestic-gold-unit-label" />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">순도 선택</label>
        <PuritySelector metal="gold" value={purity} onChange={(p) => setPurity(p as GoldPurity)} />
      </div>

      <div className="space-y-3 pt-2" data-testid="domestic-price-display">
        <div className="relative overflow-hidden rounded-xl border border-amber-500/20 bg-amber-500/[0.06] px-5 py-5 text-center">
          <p className="text-xs text-muted-foreground mb-1.5">
            {weight || 0}{unitLabel} {purity} 국내금 기준
          </p>
          <p className="text-4xl font-bold tracking-tight price-num text-amber-400" data-testid="domestic-total-price" aria-live="polite">
            {weight > 0 ? formatKRW(totalKRW) : '—'}
          </p>
          {data.changePercent !== undefined && data.changePercent !== 0 && (
            <p className={`text-sm mt-2 font-medium price-num ${getChangeColor(data.changePercent)}`}>
              <span aria-hidden="true">{getChangeIcon(data.changePercent)}</span>{' '}
              {formatChangeRate(data.changePercent)}
            </p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2.5 text-sm">
          <div className="bg-muted/30 rounded-xl p-3.5 text-center border border-border/40">
            <p className="text-xs text-muted-foreground mb-1">국내금 1g ({purity})</p>
            <p className="font-semibold price-num">{formatKRW(pricePerGramKRW)}</p>
          </div>
          <div className="bg-muted/30 rounded-xl p-3.5 text-center border border-border/40">
            <p className="text-xs text-muted-foreground mb-1">국내금 1돈 ({purity})</p>
            <p className="font-semibold price-num">{formatKRW(pricePerDonKRW)}</p>
          </div>
        </div>
        {data.updatedAt && (
          <p className="text-xs text-muted-foreground/60 text-center">
            기준 일자: {data.updatedAt} (KRX 금시장)
          </p>
        )}
      </div>
    </div>
  )
}

// ─── 차트 ───

function DomesticPriceChart({ entries }: { entries: DomesticHistoryEntry[] }) {
  const data = entries.map((e) => ({ date: e.date, krw: e.priceKRW }))
  return (
    <div role="img" aria-label="국내 금시세 차트" data-testid="domestic-price-chart">
      <ResponsiveContainer width="100%" height={240}>
        <ComposedChart data={data} margin={{ top: 8, right: 16, left: 4, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
          <XAxis
            dataKey="date"
            tickFormatter={(v) => { const d = new Date(v); return `${d.getMonth() + 1}/${d.getDate()}` }}
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={{ stroke: 'hsl(var(--border))' }}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(v) => `₩${(v / 1000).toFixed(0)}k`}
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={false}
            tickLine={false}
            width={65}
          />
          <Tooltip
            formatter={(value: number) => [formatKRW(value) + '/g', '국내금']}
            labelFormatter={(label) => formatDate(label as string)}
            contentStyle={{
              background: 'hsl(var(--popover))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '0.75rem',
              fontSize: 12,
            }}
          />
          <Line
            type="monotone"
            dataKey="krw"
            name="원화/g"
            stroke="#f5c518"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: '#f5c518', strokeWidth: 0 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

// ─── 테이블 ───

function DomesticPriceTable({ entries }: { entries: DomesticHistoryEntry[] }) {
  const reversed = useMemo(() => {
    const arr = [...entries].reverse()
    return arr.map((entry, i) => {
      const prev = i > 0 ? arr[i - 1].priceKRW : null
      const changeRate = prev ? ((entry.priceKRW - prev) / prev) * 100 : undefined
      return { ...entry, changeRate }
    })
  }, [entries])

  return (
    <div className="overflow-x-auto rounded-xl border border-border/40" data-testid="domestic-price-table">
      <table className="w-full text-sm" role="table" aria-label="날짜별 국내 금시세">
        <thead>
          <tr className="border-b border-border/40 bg-muted/30">
            <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">날짜</th>
            <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">종가 (원/g)</th>
            <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">전일 대비</th>
          </tr>
        </thead>
        <tbody>
          {reversed.map((entry) => {
            const changeColor = entry.changeRate !== undefined ? getChangeColor(entry.changeRate) : ''
            return (
              <tr key={entry.date} className="border-b border-border/30 last:border-0 hover:bg-muted/20 transition-colors">
                <td className="px-4 py-2.5 text-sm text-muted-foreground">{formatDate(entry.date)}</td>
                <td className="px-4 py-2.5 text-right price-num font-medium">{formatKRW(entry.priceKRW)}</td>
                <td className={`px-4 py-2.5 text-right price-num text-sm ${changeColor}`}>
                  {entry.changeRate !== undefined ? (
                    <span aria-label={`전일 대비 ${formatChangeRate(entry.changeRate)}`}>
                      <span aria-hidden="true">{getChangeIcon(entry.changeRate)}</span>{' '}
                      {formatChangeRate(entry.changeRate)}
                    </span>
                  ) : <span className="text-muted-foreground/40">—</span>}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ─── 요약 배지 ───

function DomesticPriceSummary({ entries }: { entries: DomesticHistoryEntry[] }) {
  if (entries.length === 0) return null

  const highest = entries.reduce((a, b) => (a.priceKRW >= b.priceKRW ? a : b))
  const lowest = entries.reduce((a, b) => (a.priceKRW <= b.priceKRW ? a : b))
  const avgKRW = Math.round(entries.reduce((sum, e) => sum + e.priceKRW, 0) / entries.length)

  return (
    <div className="grid grid-cols-3 gap-2.5" data-testid="domestic-price-summary">
      <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2.5">
        <p className="text-xs text-muted-foreground mb-0.5">최고</p>
        <p className="font-bold text-sm price-num text-red-400">{formatKRW(highest.priceKRW)}<span className="text-xs font-normal text-muted-foreground">/g</span></p>
        <p className="text-xs text-muted-foreground/70 mt-0.5">{formatDate(highest.date)}</p>
      </div>
      <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 px-3 py-2.5">
        <p className="text-xs text-muted-foreground mb-0.5">최저</p>
        <p className="font-bold text-sm price-num text-blue-400">{formatKRW(lowest.priceKRW)}<span className="text-xs font-normal text-muted-foreground">/g</span></p>
        <p className="text-xs text-muted-foreground/70 mt-0.5">{formatDate(lowest.date)}</p>
      </div>
      <div className="rounded-xl border border-border/40 bg-muted/40 px-3 py-2.5">
        <p className="text-xs text-muted-foreground mb-0.5">평균</p>
        <p className="font-bold text-sm price-num">{formatKRW(avgKRW)}<span className="text-xs font-normal text-muted-foreground">/g</span></p>
        <p className="text-xs text-muted-foreground/70 mt-0.5">기간 평균</p>
      </div>
    </div>
  )
}

// ─── 히스토리 섹션 ───

function DomesticHistoryContent({ period }: { period: Period }) {
  const { data: entries, isLoading, isError } = useDomesticGoldHistory(period)

  if (isLoading) return <ChartSkeleton />
  if (isError || !entries) return <ErrorAlert />
  if (entries.length === 0) return <p className="text-muted-foreground text-center py-8">데이터가 없습니다.</p>

  return (
    <div className="space-y-4">
      <DomesticPriceSummary entries={entries} />
      <DomesticPriceChart entries={entries} />
      <DomesticPriceTable entries={entries} />
    </div>
  )
}

// ─── 메인 섹션 ───

export default function DomesticGoldSection() {
  const supportedOptions = getSupportedPeriodOptions('domestic-gold')
  const [period, setPeriod] = useState<Period>(supportedOptions[0].key)

  return (
    <div className="space-y-6">
      <section aria-labelledby="domestic-calc-title" data-testid="domestic-gold-section">
        <Card className="card-glow-gold">
          <CardHeader className="pb-3">
            <CardTitle id="domestic-calc-title" className="flex items-center gap-2 text-base">
              <span className="w-1.5 h-5 rounded-full bg-amber-400" aria-hidden="true" />
              국내 금시세 계산기
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DomesticCalculator />
          </CardContent>
        </Card>
      </section>

      <section aria-labelledby="domestic-history-title" data-testid="domestic-history-section">
        <Card className="card-glow-gold">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <CardTitle id="domestic-history-title" className="flex items-center gap-2 text-base">
                <span className="w-1.5 h-5 rounded-full bg-amber-400" aria-hidden="true" />
                국내금 시세 변동
              </CardTitle>
              <div
                role="tablist"
                aria-label="기간 선택"
                className="inline-flex items-center gap-0.5 p-1 rounded-lg bg-muted/50 border border-border/40"
              >
                {supportedOptions.map(({ key, label }) => (
                  <button
                    key={key}
                    id={`domestic-gold-tab-${key}`}
                    role="tab"
                    aria-selected={period === key}
                    aria-controls="domestic-gold-tabpanel"
                    onClick={() => setPeriod(key)}
                    data-testid={`domestic-period-tab-${key}`}
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
            id="domestic-gold-tabpanel"
            role="tabpanel"
            aria-labelledby={`domestic-gold-tab-${period}`}
          >
            <DomesticHistoryContent period={period} />
          </CardContent>
        </Card>
      </section>

      <Alert variant="warning" role="note" aria-label="국내 금시세 안내">
        <AlertDescription className="text-xs leading-relaxed">
          <strong>⚠️ 안내:</strong> 국내 금시세는 KRX 한국거래소 금시장 기준가이며,
          금은방 소매가와는 차이가 있을 수 있습니다. 본 정보는 참고 목적으로만 제공됩니다.
        </AlertDescription>
      </Alert>
    </div>
  )
}
