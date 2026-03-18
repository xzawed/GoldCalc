# Sprint 04 — 금시세 예측 (3구역)

**목표**: 이동평균·선형 회귀 기반 단기 예측 차트와 시장 신호 요약을 구현하고 면책 문구 필수 표시
**기간**: 3일
**선행 조건**: Sprint 03 완료 (히스토리 데이터 훅 재사용)
**결과물**: 과거+예측 통합 차트, 시장 신호 카드, 면책 문구가 포함된 예측 섹션

---

## 체크리스트

### [ ] 4-1. 예측 알고리즘 (`src/utils/forecast.ts`)

모든 함수는 순수 함수. 단위 테스트 필수.

```ts
// ① 단순 이동평균
export function movingAverage(data: number[], period: number): (number | null)[] {
  return data.map((_, i) => {
    if (i < period - 1) return null;
    const slice = data.slice(i - period + 1, i + 1);
    return slice.reduce((a, b) => a + b, 0) / period;
  });
}

// ② 선형 회귀 계수 (최소제곱법)
export function linearRegression(data: number[]): {
  slope: number;
  intercept: number;
  r2: number; // 결정계수 (모델 적합도 0~1)
}

// ③ 향후 N일 예측값
export function forecastNext(data: number[], days: number): number[]

// ④ 표준편차
export function standardDeviation(data: number[]): number

// ⑤ 신뢰 구간 (±1σ)
export function confidenceBand(
  predicted: number[],
  stdDev: number
): Array<{ upper: number; lower: number }>

// ⑥ 트렌드 방향 판단 (MA5 vs MA20 교차)
export function detectTrend(
  data: number[]
): 'bullish' | 'bearish' | 'neutral'
```

단위 테스트 (`src/utils/forecast.test.ts`):
```ts
describe('이동평균', () => {
  test('period보다 짧은 구간은 null 반환', ...)
  test('5일 MA 계산 정확도', ...)
})
describe('선형 회귀', () => {
  test('완벽한 선형 데이터에서 R² = 1', ...)
  test('slope 방향 정확도 (상승 데이터 → 양수 slope)', ...)
})
describe('표준편차', () => {
  test('알려진 데이터셋 대비 검증', ...)
})
```

---

### [ ] 4-2. 예측 데이터 훅 (`src/hooks/useForecast.ts`)

히스토리 데이터를 받아 예측 포인트 배열 반환. API 호출 없음 (순수 계산).

```ts
export function useForecast(
  history: HistoryEntry[],
  forecastDays: ForecastDays
): ForecastPoint[] {
  return useMemo(() => {
    if (history.length < 30) return []; // 데이터 부족 시 빈 배열

    const prices = history.map(h => h.priceUSD);
    const stdDev = standardDeviation(prices.slice(-90));

    // 과거 구간: 실제값
    const actualPoints: ForecastPoint[] = history.slice(-30).map(h => ({
      date: h.date,
      actual: h.priceUSD,
    }));

    // 미래 구간: 예측값 + 신뢰 구간
    const predicted = forecastNext(prices, forecastDays);
    const bands = confidenceBand(predicted, stdDev);
    const lastDate = new Date(history[history.length - 1].date);

    const forecastPoints: ForecastPoint[] = predicted.map((p, i) => ({
      date: format(addDays(lastDate, i + 1), 'yyyy-MM-dd'),
      predicted: Math.round(p),
      upper: bands[i].upper,
      lower: bands[i].lower,
    }));

    return [...actualPoints, ...forecastPoints];
  }, [history, forecastDays]);
}
```

---

### [ ] 4-3. 예측 차트 (`src/components/forecast/ForecastChart.tsx`)

Recharts `ComposedChart` — 실선 + 점선 + 신뢰 구간 영역.

```tsx
<ComposedChart data={forecastData}>
  <CartesianGrid strokeDasharray="3 3" />
  <XAxis dataKey="date" />
  <YAxis domain={['auto', 'auto']} />
  <Tooltip content={<ForecastTooltip />} />

  {/* 신뢰 구간 영역 (하한~상한) */}
  <Area
    dataKey="upper"
    fill="#f59e0b"
    stroke="none"
    fillOpacity={0.15}
    legendType="none"
  />
  <Area
    dataKey="lower"
    fill="#f59e0b"
    stroke="none"
    fillOpacity={0}
    legendType="none"
  />

  {/* 과거 실제값: 실선 */}
  <Line
    dataKey="actual"
    stroke="#f59e0b"
    strokeWidth={2}
    dot={false}
    name="실제값"
    connectNulls={false}
  />

  {/* 예측값: 점선 */}
  <Line
    dataKey="predicted"
    stroke="#f59e0b"
    strokeWidth={2}
    strokeDasharray="5 5"
    dot={false}
    name="예측값"
    connectNulls={false}
  />

  {/* 과거/예측 경계 수직선 */}
  <ReferenceLine
    x={lastActualDate}
    stroke="#6b7280"
    strokeDasharray="3 3"
    label={{ value: '현재', position: 'top' }}
  />
</ComposedChart>
```

툴팁 커스텀:
```tsx
const ForecastTooltip = ({ active, payload, label }) => {
  // 실제값 구간과 예측 구간을 구분하여 표시
  // 예측 구간: 예측값 + 범위 (lower ~ upper) 표시
};
```

---

### [ ] 4-4. 시장 신호 훅 (`src/hooks/useMarketSignals.ts`)

보조 지표 API 호출. 데이터가 없어도 예측 섹션 전체가 무너지지 않도록 독립적 처리.

```ts
export function useMarketSignals() {
  const dxy = useQuery({
    queryKey: ['dxy'],
    queryFn: () => fetchAlphaVantage('DX-Y.NYB'), // 달러 인덱스
    staleTime: 24 * 60 * 60 * 1000,
  });

  const treasuryYield = useQuery({
    queryKey: ['treasury10y'],
    queryFn: () => fetchFredSeries('DGS10'),        // 미국 10년 국채
    staleTime: 24 * 60 * 60 * 1000,
  });

  const vix = useQuery({
    queryKey: ['vix'],
    queryFn: () => fetchAlphaVantage('^VIX'),       // VIX 지수
    staleTime: 24 * 60 * 60 * 1000,
  });

  return { dxy, treasuryYield, vix };
}
```

---

### [ ] 4-5. 시장 신호 카드 (`src/components/forecast/MarketSignals.tsx`)

```tsx
interface Props {
  signals: MarketSignal[];
}

// 카드 표시:
// ┌──────────────────────────────────────────┐
// │  달러 인덱스(DXY)  104.2  ▲  (금 하락 압력)  │
// │  미국 국채 10년물   4.35%  ▼  (금 상승 요인)  │
// │  VIX 지수         18.5   ─  (중립)           │
// └──────────────────────────────────────────┘
```

금·달러·금리 상관관계 간단 설명 툴팁 추가:
- DXY ↑ → 금 하락 압력 (역상관)
- 국채금리 ↑ → 금 보유 기회비용 증가 → 하락 압력
- VIX ↑ → 안전자산 수요 증가 → 금 상승 요인

API 데이터 없을 때: 해당 신호 카드 숨김 처리 (섹션 전체 미표시 금지).

---

### [ ] 4-6. 면책 문구 컴포넌트 (`src/components/forecast/Disclaimer.tsx`)

**제거 또는 숨김 처리 절대 금지.**

```tsx
export function Disclaimer() {
  return (
    <Alert className="mt-4 border-amber-200 bg-amber-50">
      <AlertDescription className="text-xs text-gray-600">
        ⚠️ 본 예측은 통계적 추세 분석(이동평균, 선형 회귀)에 기반한 참고 정보이며,
        투자 조언이 아닙니다. 실제 금 가격은 지정학적 요인, 중앙은행 정책,
        수급 변동 등 다양한 요인에 의해 예측과 크게 다를 수 있습니다.
        투자 결정은 반드시 전문가와 상담하시기 바랍니다.
      </AlertDescription>
    </Alert>
  );
}
```

---

### [ ] 4-7. 예측 섹션 통합 (`src/components/forecast/GoldForecast.tsx`)

```tsx
export function GoldForecast() {
  const [forecastDays, setForecastDays] = useState<ForecastDays>(7);
  const { data: history } = useGoldHistory('3M'); // 예측 기반 데이터
  const forecastData = useForecast(history ?? [], forecastDays);
  const signals = useMarketSignals();

  const trend = useMemo(() => {
    if (!history?.length) return null;
    return detectTrend(history.map(h => h.priceUSD));
  }, [history]);

  return (
    <section>
      <h2>금시세 예측</h2>
      <TrendBadge trend={trend} /> {/* 상승세 / 하락세 / 중립 배지 */}

      {/* 예측 기간 선택 */}
      <Tabs value={String(forecastDays)} onValueChange={v => setForecastDays(Number(v) as ForecastDays)}>
        <TabsTrigger value="7">7일</TabsTrigger>
        <TabsTrigger value="30">30일</TabsTrigger>
      </Tabs>

      <ForecastChart data={forecastData} />
      <MarketSignals signals={...} />
      <Disclaimer /> {/* 항상 렌더링 */}
    </section>
  );
}
```

---

### [ ] 4-8. 트렌드 배지 (`src/components/forecast/TrendBadge.tsx`)

```tsx
// 상승세 → 🟢 상승 추세  (green)
// 하락세 → 🔴 하락 추세  (red)
// 중립   → ⚪ 추세 불명확 (gray)
// + 예측 방법론 텍스트: "MA5/MA20 이동평균 + 선형 회귀 기반"
```

---

## Sprint 04 완료 기준

- [ ] 7일/30일 예측 탭 전환 시 차트 업데이트
- [ ] 과거 실제값(실선)과 예측값(점선) 시각적으로 명확히 구분
- [ ] 신뢰 구간 반투명 영역 표시
- [ ] 과거/예측 경계 수직 기준선 표시
- [ ] 시장 신호 카드 표시 (API 실패 시 해당 카드만 숨김)
- [ ] 면책 문구 항상 렌더링 (숨김 처리 없음)
- [ ] TypeScript 에러 0건

### 테스트 완료 기준 (testing.md 참고)
- [ ] **UT-03** `forecast.test.ts` — MA·선형회귀·표준편차·신뢰구간·트렌드 전 케이스 (커버리지 95%)
- [ ] **IT-03** `useForecast.test.ts` — 7일/30일 포인트 수, upper≥predicted≥lower, 데이터 부족 처리
- [ ] **IT-06** `GoldForecast.test.tsx` — 면책 문구 항상 표시, 탭 전환, 시장 신호 API 실패 처리
- [ ] **FT-03** `forecast.test.tsx` — A~C 시나리오 전부 통과
- [ ] `data-testid` 속성 추가: `forecast-chart`, `disclaimer`
- [ ] 면책 문구 `data-testid="disclaimer"`는 절대 조건부 렌더링하지 않음 확인
