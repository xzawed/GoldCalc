# Sprint 03 — 날짜별 시세 변동 내역 (2구역)

**목표**: 기간별 금시세 히스토리를 차트·테이블로 시각화하고 최고/최저/평균 요약 제공
**기간**: 3일
**선행 조건**: Sprint 02 완료 (환율 훅, API 패턴 재사용)
**결과물**: 기간 탭 전환 시 차트·테이블이 업데이트되는 히스토리 섹션

---

## 체크리스트

### [ ] 3-1. 히스토리 데이터 fetch 훅 (`src/hooks/useGoldHistory.ts`)

GoldAPI.io 날짜별 엔드포인트(`/api/XAU/USD/YYYYMMDD`)를 순차 호출하여 기간 데이터를 구성.

```ts
import { useQuery } from '@tanstack/react-query';
import { subDays, subMonths, subYears, eachDayOfInterval, format } from 'date-fns';

function getPeriodDates(period: Period): Date[] {
  const end = new Date();
  const start = {
    '1W': subDays(end, 7),
    '1M': subMonths(end, 1),
    '3M': subMonths(end, 3),
    '1Y': subYears(end, 1),
  }[period];
  return eachDayOfInterval({ start, end });
}

export function useGoldHistory(period: Period) {
  return useQuery({
    queryKey: ['goldHistory', period],
    queryFn: async () => {
      const dates = getPeriodDates(period);
      // 주말 제외 (금 시장은 주중만 운영)
      const tradingDays = dates.filter(d => d.getDay() !== 0 && d.getDay() !== 6);
      // 순차 fetch (rate limit 방지)
      const entries: HistoryEntry[] = [];
      for (const date of tradingDays) {
        const dateStr = format(date, 'yyyyMMdd');
        try {
          const data = await apiFetch<GoldPriceResponse>(
            `https://www.goldapi.io/api/XAU/USD/${dateStr}`,
            { 'x-access-token': import.meta.env.VITE_GOLD_API_KEY }
          );
          entries.push(transformToHistoryEntry(data, date));
        } catch {
          // 해당 날짜 데이터 없으면 skip
        }
      }
      return calculateChangeRates(entries); // 전일 대비 등락률 계산
    },
    staleTime: 24 * 60 * 60 * 1000, // 24시간 캐시
    gcTime: 24 * 60 * 60 * 1000,
  });
}
```

> **주의**: GoldAPI.io 무료 플랜은 월 100회 요청 제한. 1M 기간 = 약 22 거래일 = 22회 소모. 24시간 캐시 필수.

---

### [ ] 3-2. 히스토리 데이터 변환 함수 (`src/utils/historyCalc.ts`)

```ts
// API 응답 → HistoryEntry 변환
export function transformToHistoryEntry(
  data: GoldPriceResponse,
  date: Date,
  exchangeRate: number
): HistoryEntry

// 전일 대비 등락률 계산
export function calculateChangeRates(entries: HistoryEntry[]): HistoryEntry[]

// 기간 내 최고/최저/평균 계산
export function calcPeriodSummary(entries: HistoryEntry[]): {
  highest: HistoryEntry;
  lowest: HistoryEntry;
  average: number; // USD/oz 평균
}
```

단위 테스트 (`src/utils/historyCalc.test.ts`):
```ts
test('등락률 계산 — 100 → 110이면 +10%', ...)
test('최고/최저/평균 정확도', ...)
```

---

### [ ] 3-3. 요약 배지 컴포넌트 (`src/components/history/PriceSummary.tsx`)

shadcn/ui `Card` + `Badge` 사용.

```tsx
interface Props {
  highest: HistoryEntry;
  lowest: HistoryEntry;
  averageUSD: number;
  exchangeRate: number;
}
```

표시 레이아웃:
```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   최고가      │  │   최저가      │  │   평균가      │
│  $2,750      │  │  $2,580      │  │  $2,650      │
│ 112,340원/g  │  │ 102,100원/g  │  │ 107,200원/g  │
│ 2026-01-15   │  │ 2026-02-03   │  │              │
└──────────────┘  └──────────────┘  └──────────────┘
```

---

### [ ] 3-4. 시세 변동 차트 (`src/components/history/PriceChart.tsx`)

Recharts `ComposedChart` + 이중 Y축.

```tsx
import {
  ComposedChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

// 차트 데이터 변환
const chartData = entries.map(e => ({
  date: format(new Date(e.date), 'M/d'),
  usd: e.priceUSD,
  krw: e.priceKRWperGram,
}));
```

구성:
- 좌측 Y축: USD/oz (금색 `#f59e0b`)
- 우측 Y축: 원화/g (에메랄드 `#10b981`)
- X축: 날짜 (기간에 따라 표시 간격 자동 조정)
- 툴팁 커스텀: 날짜 + USD + 원화 동시 표시

```tsx
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border rounded p-3 shadow text-sm">
      <p className="font-semibold mb-1">{label}</p>
      <p className="text-amber-600">{formatUSD(payload[0]?.value)} / oz</p>
      <p className="text-emerald-600">{formatKRW(payload[1]?.value)} / g</p>
    </div>
  );
};
```

---

### [ ] 3-5. 날짜별 시세 테이블 (`src/components/history/PriceTable.tsx`)

```tsx
interface Props {
  entries: HistoryEntry[];
}

// 컬럼: 날짜 | 국제금시세(USD/oz) | 환율 | 원화/g | 전일대비
// 최신 날짜 상단 (내림차순)
// 전일대비: 색상 + 화살표 아이콘 + 등락률
```

등락 표시 예:
```
▲ +1.23%   → text-red-500 (빨강, 상승)
▼ -0.87%   → text-blue-500 (파랑, 하락)
─  0.00%   → text-gray-500
```

행 수가 많을 경우 최초 20행만 표시, "더 보기" 버튼으로 전체 표시.

---

### [ ] 3-6. 히스토리 섹션 통합 (`src/components/history/PriceHistory.tsx`)

```tsx
export function PriceHistory() {
  const [period, setPeriod] = useState<Period>('1M');
  const { data: history, isLoading, isError } = useGoldHistory(period);
  const { data: exchangeRate } = useExchangeRate();

  const summary = useMemo(() => {
    if (!history?.length) return null;
    return calcPeriodSummary(history);
  }, [history]);

  return (
    <section>
      <h2>시세 변동 내역</h2>
      {/* 기간 탭 */}
      <Tabs value={period} onValueChange={setPeriod}>
        <TabsList>
          <TabsTrigger value="1W">1주</TabsTrigger>
          <TabsTrigger value="1M">1개월</TabsTrigger>
          <TabsTrigger value="3M">3개월</TabsTrigger>
          <TabsTrigger value="1Y">1년</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading && <ChartSkeleton />}
      {isError && <ErrorAlert />}
      {history && (
        <>
          <PriceChart entries={history} />
          <PriceSummary {...summary} />
          <PriceTable entries={history} />
        </>
      )}
    </section>
  );
}
```

---

### [ ] 3-7. 로딩 스켈레톤 (`src/components/history/ChartSkeleton.tsx`)

```tsx
// 차트 영역 Skeleton (높이 280px)
// 배지 3개 Skeleton
// 테이블 5행 Skeleton
```

---

## Sprint 03 완료 기준

- [ ] 4가지 기간 탭(1주/1개월/3개월/1년) 전환 시 차트·테이블 업데이트
- [ ] 이중 Y축 차트 정상 렌더링 (USD/oz + 원화/g)
- [ ] 차트 호버 툴팁 동작
- [ ] 최고가/최저가/평균가 배지 정확한 값 표시
- [ ] 테이블 등락 색상 올바른 적용 (상승 빨강, 하락 파랑)
- [ ] 기간 탭 재선택 시 캐시 활용 (동일 요청 재fetch 없음)
- [ ] 로딩 중 Skeleton, 에러 시 Alert 표시
- [ ] TypeScript 에러 0건

### 테스트 완료 기준 (testing.md 참고)
- [ ] **UT-02** `historyCalc.test.ts` — 등락률·최고/최저/평균 케이스 통과 (커버리지 95%)
- [ ] **IT-02** `useGoldHistory.test.ts` — 기간별 fetch, 주말 제외, period 변경 통과
- [ ] **IT-05** `PriceHistory.test.tsx` — 탭 전환·배지·테이블·로딩 통과
- [ ] **FT-02** `history.test.tsx` — A~C 시나리오 전부 통과
- [ ] `data-testid` 속성 추가: `price-chart`, `chart-skeleton`, `summary-high`, `summary-low`, `summary-avg`
