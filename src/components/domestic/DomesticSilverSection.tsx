import { useState, useMemo } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorAlert } from '@/components/common/ErrorAlert'
import { ChartSkeleton } from '@/components/history/ChartSkeleton'
import { UnitSelector } from '@/components/calculator/UnitSelector'
import { PuritySelector } from '@/components/calculator/PuritySelector'
import { useSilverPrice } from '@/hooks/useSilverPrice'
import { useSilverHistory } from '@/hooks/useSilverHistory'
import { useExchangeRate } from '@/hooks/useExchangeRate'
import {
  formatKRW, formatDate,
  getChangeColor, getChangeIcon, formatChangeRate,
} from '@/utils/format'
import { weightToGrams, PURITY_RATIO, DON_TO_G, calcPricePerGram } from '@/utils/metalCalc'
import {
  ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { WeightUnit, SilverPurity, Period, HistoryEntry } from '@/types/gold'

// ─── 계산기 ───

function DomesticSilverCalculator() {
  const [weight, setWeight] = useState<number>(0)
  const [unit, setUnit] = useState<WeightUnit>('don')
  const [purity, setPurity] = useState<SilverPurity>('999')

  const { data: silverData, isLoading: silverLoading, isError: silverError } = useSilverPrice()
  const { data: rateData, isLoading: rateLoading, isError: rateError } = useExchangeRate()

  const handleWeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value)
    setWeight(isNaN(val) ? 0 : val)
  }

  if (silverLoading || rateLoading) {
    return (
      <div className="space-y-4" data-testid="domestic-silver-calculator-skeleton">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  if (silverError || rateError || !silverData || !rateData) {
    return (
      <ErrorAlert message="은시세 또는 환율을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요." />
    )
  }

  const { priceUSD, updatedAt } = silverData
  const { exchangeRate } = rateData
  const pricePerGramBase = calcPricePerGram(priceUSD, exchangeRate)

  const grams = weightToGrams(weight, unit)
  const totalKRW = Math.round(pricePerGramBase * grams * PURITY_RATIO[purity])
  const pricePerGramKRW = Math.round(pricePerGramBase * PURITY_RATIO[purity])
  const pricePerDonKRW = Math.round(pricePerGramBase * DON_TO_G * PURITY_RATIO[purity])
  const unitLabel = unit === 'g' ? 'g' : unit === 'don' ? '돈' : '냥'

  return (
    <div className="space-y-4" data-testid="domestic-silver-calculator">
      <div className="space-y-2">
        <label htmlFor="domestic-silver-weight-input" className="text-sm font-medium">무게 입력</label>
        <Input
          id="domestic-silver-weight-input"
          type="number"
          min={0}
          step={0.1}
          placeholder="무게를 입력하세요"
          value={weight || ''}
          onChange={handleWeightChange}
          data-testid="domestic-silver-weight-input"
          aria-label="은 무게 입력"
        />
      </div>
      <div className="space-y-2">
        <p className="text-sm font-medium">단위 선택</p>
        <UnitSelector value={unit} onChange={setUnit} />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">순도 선택</label>
        <PuritySelector metal="silver" value={purity} onChange={(p) => setPurity(p as SilverPurity)} />
      </div>

      <div className="space-y-4" data-testid="domestic-silver-price-display">
        <div className="text-center py-4 bg-muted/30 rounded-lg">
          <p className="text-sm text-muted-foreground mb-1">
            {weight || 0}{unitLabel} {purity} 국내은 기준
          </p>
          <p className="text-4xl font-bold tracking-tight" data-testid="domestic-silver-total-price" aria-live="polite">
            {weight > 0 ? formatKRW(totalKRW) : '—'}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="bg-muted/20 rounded p-3 text-center">
            <p className="text-muted-foreground">국내은 1g ({purity})</p>
            <p className="font-semibold">{formatKRW(pricePerGramKRW)}</p>
          </div>
          <div className="bg-muted/20 rounded p-3 text-center">
            <p className="text-muted-foreground">국내은 1돈 ({purity})</p>
            <p className="font-semibold">{formatKRW(pricePerDonKRW)}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
          <p className="bg-muted/10 rounded p-2 text-center">
            국제 은시세: ${priceUSD.toFixed(3)}/oz
          </p>
          <p className="bg-muted/10 rounded p-2 text-center">
            환율: ₩{exchangeRate.toLocaleString('ko-KR')}/USD
          </p>
        </div>
        {updatedAt && (
          <p className="text-xs text-muted-foreground text-center">
            기준 시각: {new Date(updatedAt).toLocaleString('ko-KR')} (XAG)
          </p>
        )}
      </div>
    </div>
  )
}

// ─── 히스토리 차트 (국내은: KRW 단일 Y축) ───

function DomesticSilverPriceChart({ entries }: { entries: HistoryEntry[] }) {
  const data = entries.map((e) => ({ date: e.date, krw: e.priceKRW }))

  return (
    <div role="img" aria-label="국내 은시세 차트" data-testid="domestic-silver-price-chart">
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="date"
            tickFormatter={(v) => {
              const d = new Date(v)
              return `${d.getMonth() + 1}/${d.getDate()}`
            }}
            tick={{ fontSize: 11 }}
          />
          <YAxis
            tickFormatter={(v) => `₩${(v / 1000).toFixed(1)}k`}
            tick={{ fontSize: 11 }}
            width={70}
          />
          <Tooltip
            formatter={(value: number) => [formatKRW(value) + '/g', '국내은 (999)']}
            labelFormatter={(label) => formatDate(label as string)}
          />
          <Line
            type="monotone"
            dataKey="krw"
            name="원화/g"
            stroke="#94a3b8"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

// ─── 히스토리 테이블 (국내은) ───

function DomesticSilverPriceTable({ entries }: { entries: HistoryEntry[] }) {
  const reversed = useMemo(() => {
    const arr = [...entries].reverse()
    return arr.map((entry, i) => {
      const prev = i > 0 ? arr[i - 1].priceKRW : null
      const changeRate = prev ? ((entry.priceKRW - prev) / prev) * 100 : undefined
      return { ...entry, changeRate }
    })
  }, [entries])

  return (
    <div className="overflow-x-auto" data-testid="domestic-silver-price-table">
      <table className="w-full text-sm" role="table" aria-label="날짜별 국내 은시세">
        <thead>
          <tr className="border-b text-muted-foreground text-left">
            <th className="pb-2 pr-4 font-medium">날짜</th>
            <th className="pb-2 pr-4 font-medium text-right">종가 (원/g)</th>
            <th className="pb-2 font-medium text-right">전일 대비</th>
          </tr>
        </thead>
        <tbody>
          {reversed.map((entry) => {
            const changeColor = entry.changeRate !== undefined ? getChangeColor(entry.changeRate) : ''
            return (
              <tr key={entry.date} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                <td className="py-2 pr-4">{formatDate(entry.date)}</td>
                <td className="py-2 pr-4 text-right">{formatKRW(entry.priceKRW)}</td>
                <td className={`py-2 text-right ${changeColor}`}>
                  {entry.changeRate !== undefined ? (
                    <span aria-label={`전일 대비 ${formatChangeRate(entry.changeRate)}`}>
                      <span aria-hidden="true">{getChangeIcon(entry.changeRate)}</span>{' '}
                      {formatChangeRate(entry.changeRate)}
                    </span>
                  ) : '—'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ─── 히스토리 요약 배지 ───

function DomesticSilverPriceSummary({ entries }: { entries: HistoryEntry[] }) {
  if (entries.length === 0) return null

  const highest = entries.reduce((a, b) => (a.priceKRW >= b.priceKRW ? a : b))
  const lowest = entries.reduce((a, b) => (a.priceKRW <= b.priceKRW ? a : b))
  const avgKRW = Math.round(entries.reduce((sum, e) => sum + e.priceKRW, 0) / entries.length)

  return (
    <div className="flex flex-wrap gap-3" data-testid="domestic-silver-price-summary">
      <div className="flex items-center gap-2 rounded-lg border px-3 py-2">
        <Badge variant="destructive" className="text-xs">최고</Badge>
        <div>
          <p className="font-semibold text-sm">{formatKRW(highest.priceKRW)}/g</p>
          <p className="text-xs text-muted-foreground">{formatDate(highest.date)}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 rounded-lg border px-3 py-2">
        <Badge className="text-xs bg-blue-500 hover:bg-blue-600">최저</Badge>
        <div>
          <p className="font-semibold text-sm">{formatKRW(lowest.priceKRW)}/g</p>
          <p className="text-xs text-muted-foreground">{formatDate(lowest.date)}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 rounded-lg border px-3 py-2">
        <Badge variant="secondary" className="text-xs">평균</Badge>
        <div>
          <p className="font-semibold text-sm">{formatKRW(avgKRW)}/g</p>
          <p className="text-xs text-muted-foreground">기간 평균</p>
        </div>
      </div>
    </div>
  )
}

// ─── 히스토리 섹션 ───

const PERIOD_LABELS: Record<Period, string> = {
  '1W': '1주',
  '1M': '1개월',
  '3M': '3개월',
  '1Y': '1년',
}

function DomesticSilverHistoryContent({ period }: { period: Period }) {
  const { data: rateData } = useExchangeRate()
  const exchangeRate = rateData?.exchangeRate ?? 0

  const { data: entries, isLoading, isError } = useSilverHistory(period, exchangeRate)

  if (isLoading || exchangeRate === 0) return <ChartSkeleton />
  if (isError || !entries) return <ErrorAlert />
  if (entries.length === 0) return <p className="text-muted-foreground text-center py-8">데이터가 없습니다.</p>

  return (
    <div className="space-y-4">
      <DomesticSilverPriceSummary entries={entries} />
      <DomesticSilverPriceChart entries={entries} />
      <DomesticSilverPriceTable entries={entries} />
    </div>
  )
}

// ─── 메인 섹션 ───

export default function DomesticSilverSection() {
  const [period, setPeriod] = useState<Period>('1W')

  return (
    <div className="space-y-8">
      <section aria-labelledby="domestic-silver-calc-title" data-testid="domestic-silver-section">
        <Card>
          <CardHeader>
            <CardTitle id="domestic-silver-calc-title">국내 은시세 계산기</CardTitle>
          </CardHeader>
          <CardContent>
            <DomesticSilverCalculator />
          </CardContent>
        </Card>
      </section>

      <section aria-labelledby="domestic-silver-history-title" data-testid="domestic-silver-history-section">
        <Card>
          <CardHeader>
            <CardTitle id="domestic-silver-history-title">국내은 날짜별 시세 변동</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)}>
              <TabsList className="grid grid-cols-4 w-full mb-4" aria-label="기간 선택">
                {(Object.entries(PERIOD_LABELS) as [Period, string][]).map(([p, label]) => (
                  <TabsTrigger key={p} value={p} data-testid={`domestic-silver-period-tab-${p}`}>{label}</TabsTrigger>
                ))}
              </TabsList>
              {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
                <TabsContent key={p} value={p}>
                  {period === p && <DomesticSilverHistoryContent period={p} />}
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </section>

      <Alert variant="warning" role="note" aria-label="국내 은시세 안내">
        <AlertDescription className="text-xs leading-relaxed">
          <strong>⚠️ 안내:</strong> 국내 은시세는 국제 XAG/USD 시세를 실시간 USD/KRW 환율로 환산한 참고 가격입니다.
          KRX에는 은 현물 시장이 없으며, 금은방 소매가·제조사 기준가와는 차이가 있을 수 있습니다.
          본 정보는 참고 목적으로만 제공됩니다.
        </AlertDescription>
      </Alert>
    </div>
  )
}
