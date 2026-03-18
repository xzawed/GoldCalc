# GoldCalc — Skills Reference

이 문서는 GoldCalc 프로젝트를 구현하는 데 필요한 기술 역량과 구현 패턴을 정리한 참고서입니다.
각 스킬 항목은 어떤 파일에서 어떻게 적용되는지 함께 기술합니다.

---

## 1. React & TypeScript 기초

### 컴포넌트 설계
- **관심사 분리**: UI 컴포넌트 / 커스텀 훅 / 유틸 함수를 엄격히 분리
- **Props 타이핑**: `types/gold.ts`에 공유 타입을 정의하고 import하여 사용
- **조건부 렌더링**: API 로딩 중 스켈레톤 UI, 에러 시 fallback 표시

```tsx
// 타입 정의 예시 (types/gold.ts)
export interface GoldPrice {
  price: number;        // USD/troy oz
  currency: string;     // 'USD'
  timestamp: string;    // ISO 8601
}

export interface HistoryEntry {
  date: string;         // 'YYYY-MM-DD'
  priceUSD: number;
  exchangeRate: number;
  priceKRW: number;
  changeRate: number;   // 전일 대비 등락률 (%)
}

export type WeightUnit = 'g' | 'don' | 'nyang';
export type Purity = '24K' | '18K' | '14K';
```

### 상태 관리 패턴
- `useState`: 단위 선택, 입력값, 기간 탭 등 로컬 UI 상태
- `useEffect`: API fetch 트리거, 의존성 배열로 불필요한 재호출 방지
- `useMemo`: 히스토리 데이터의 최고/최저/평균 계산 메모이제이션

---

## 2. 커스텀 훅 패턴

모든 API 호출은 TanStack Query 훅으로 캡슐화. 컴포넌트에서 직접 fetch / useEffect fetch 금지.

### useGoldPrice — 현재 금시세

```ts
// hooks/useGoldPrice.ts
export function useGoldPrice() {
  return useQuery({
    queryKey: ['goldPrice'],
    queryFn: async () => {
      return apiFetch<GoldPriceResponse>(
        'https://www.goldapi.io/api/XAU/USD',
        { 'x-access-token': import.meta.env.VITE_GOLD_API_KEY }
      );
    },
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
    refetchIntervalInBackground: false,
  });
}
```

### useGoldHistory — 기간별 히스토리

```ts
// hooks/useGoldHistory.ts
export function useGoldHistory(period: Period) {
  return useQuery({
    queryKey: ['goldHistory', period],
    queryFn: async () => {
      // 날짜 범위 계산 후 GoldAPI.io 히스토리 엔드포인트 순차 호출
      // 주말 제외 처리
    },
    staleTime: 24 * 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
  });
}
```

### useExchangeRate — 환율

```ts
// hooks/useExchangeRate.ts
export function useExchangeRate(): {
  rate: number | null;   // USD/KRW
  loading: boolean;
  error: string | null;
}
```

### useForecast — 예측 데이터

```ts
// hooks/useForecast.ts
export interface ForecastPoint {
  date: string;
  predicted: number;    // 예측값 (USD/oz)
  upper: number;        // 신뢰 구간 상한
  lower: number;        // 신뢰 구간 하한
  isActual: false;
}

export function useForecast(history: HistoryEntry[], days: 7 | 30): ForecastPoint[]
```

---

## 3. 금시세 환산 계산 (`utils/goldCalc.ts`)

모든 함수는 순수 함수(pure function)로 작성 — 사이드 이펙트 없음.

### 핵심 상수

```ts
export const TROY_OZ_TO_G = 31.1035;
export const DON_TO_G = 3.75;
export const NYANG_TO_G = 37.5;

export const PURITY: Record<string, number> = {
  '24K': 0.9999,
  '18K': 0.75,
  '14K': 0.583,
};
```

### 환산 함수

```ts
// USD/oz → 원화/g
export function calcKRWperGram(usdPerOz: number, exchangeRate: number): number {
  return Math.round((usdPerOz / TROY_OZ_TO_G) * exchangeRate);
}

// 무게 입력 → 원화 총액
export function calcTotal(
  amount: number,
  unit: WeightUnit,
  usdPerOz: number,
  exchangeRate: number,
  purity: Purity
): number {
  const grams = convertToGrams(amount, unit);
  const krwPerGram = calcKRWperGram(usdPerOz, exchangeRate);
  return Math.round(krwPerGram * grams * PURITY[purity]);
}

// 단위 → 그램 변환
export function convertToGrams(amount: number, unit: WeightUnit): number {
  switch (unit) {
    case 'g':     return amount;
    case 'don':   return amount * DON_TO_G;
    case 'nyang': return amount * NYANG_TO_G;
  }
}
```

---

## 4. 예측 알고리즘 (`utils/forecast.ts`)

### 이동평균 (Moving Average)

```ts
// N일 단순 이동평균 계산
export function movingAverage(data: number[], period: number): (number | null)[] {
  return data.map((_, i) => {
    if (i < period - 1) return null;
    const slice = data.slice(i - period + 1, i + 1);
    return slice.reduce((a, b) => a + b, 0) / period;
  });
}
```

### 선형 회귀 (Linear Regression)

```ts
// 최소제곱법으로 기울기(slope)와 절편(intercept) 계산
export function linearRegression(data: number[]): { slope: number; intercept: number } {
  const n = data.length;
  const x = Array.from({ length: n }, (_, i) => i);
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = data.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((acc, xi, i) => acc + xi * data[i], 0);
  const sumX2 = x.reduce((acc, xi) => acc + xi * xi, 0);
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
}

// 향후 N일 예측값 배열 반환
export function forecastNext(data: number[], days: number): number[] {
  const { slope, intercept } = linearRegression(data);
  return Array.from({ length: days }, (_, i) =>
    Math.round(intercept + slope * (data.length + i))
  );
}
```

### 신뢰 구간 계산

```ts
// 표준편차 기반 ±1σ 신뢰 구간
export function confidenceBand(
  predicted: number[],
  stdDev: number
): Array<{ upper: number; lower: number }> {
  return predicted.map(p => ({
    upper: Math.round(p + stdDev),
    lower: Math.round(p - stdDev),
  }));
}

// 표준편차 계산
export function standardDeviation(data: number[]): number {
  const mean = data.reduce((a, b) => a + b, 0) / data.length;
  const variance = data.reduce((acc, x) => acc + (x - mean) ** 2, 0) / data.length;
  return Math.sqrt(variance);
}
```

---

## 5. Recharts 차트 구현

### 히스토리 차트 — 이중 Y축 라인 차트

```tsx
// components/history/PriceChart.tsx 핵심 구조
import {
  ComposedChart, Line, XAxis, YAxis, Tooltip,
  Legend, ResponsiveContainer, CartesianGrid
} from 'recharts';

<ResponsiveContainer width="100%" height={300}>
  <ComposedChart data={chartData}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="date" />
    <YAxis yAxisId="usd" orientation="left" />
    <YAxis yAxisId="krw" orientation="right" />
    <Tooltip formatter={(value, name) => [
      value.toLocaleString('ko-KR'), name
    ]} />
    <Line yAxisId="usd" dataKey="priceUSD" stroke="#f59e0b" dot={false} />
    <Line yAxisId="krw" dataKey="priceKRW" stroke="#10b981" dot={false} />
  </ComposedChart>
</ResponsiveContainer>
```

### 예측 차트 — 실선 + 점선 + 신뢰 구간

```tsx
// components/forecast/ForecastChart.tsx 핵심 구조
import { Area, Line, ComposedChart, ... } from 'recharts';

// 과거 실제값: 실선
<Line dataKey="actual" stroke="#f59e0b" strokeWidth={2} dot={false} />

// 예측값: 점선
<Line
  dataKey="predicted"
  stroke="#f59e0b"
  strokeWidth={2}
  strokeDasharray="5 5"
  dot={false}
/>

// 신뢰 구간: 반투명 영역
<Area
  dataKey="band"          // [lower, upper] 형태
  stroke="none"
  fill="#f59e0b"
  fillOpacity={0.15}
/>
```

### 등락 색상 규칙
- 상승: `#ef4444` (빨강) — 한국 증시 관례
- 하락: `#3b82f6` (파랑) — 한국 증시 관례
- 보합: `#6b7280` (회색)

```ts
export function getChangeColor(changeRate: number): string {
  if (changeRate > 0) return '#ef4444';
  if (changeRate < 0) return '#3b82f6';
  return '#6b7280';
}
```

---

## 6. API 연동 패턴

### fetch 래퍼 — 에러 핸들링 표준화

```ts
// utils/api.ts
export async function apiFetch<T>(url: string, headers?: HeadersInit): Promise<T> {
  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }
  return response.json() as Promise<T>;
}
```

### GoldAPI.io 응답 구조

```ts
interface GoldAPIResponse {
  price: number;          // USD/troy oz
  price_gram_24k: number; // USD/g (24K)
  price_gram_18k: number;
  price_gram_14k: number;
  timestamp: number;      // Unix timestamp
  currency: string;       // 'USD'
}
```

### 날짜 히스토리 순차 fetch
```ts
// 기간 내 날짜 목록 생성 후 순차 호출 (rate limit 고려)
// 무료 플랜은 일 요청 수 제한 존재 → 로컬 캐싱 필수
```

### 환경변수 접근 (Vite)
```ts
const GOLD_API_KEY = import.meta.env.VITE_GOLD_API_KEY;
const EXCHANGE_API_KEY = import.meta.env.VITE_EXCHANGE_API_KEY;
```

---

## 7. 숫자 포맷 규칙

```ts
// 원화 표시 — 천 단위 콤마 + '원' 단위
export function formatKRW(value: number): string {
  return value.toLocaleString('ko-KR') + '원';
}

// USD 표시
export function formatUSD(value: number): string {
  return '$' + value.toLocaleString('en-US', { minimumFractionDigits: 2 });
}

// 등락률 표시
export function formatChangeRate(rate: number): string {
  const sign = rate > 0 ? '+' : '';
  return `${sign}${rate.toFixed(2)}%`;
}

// 날짜 표시 (히스토리 테이블)
export function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('ko-KR', {
    year: 'numeric', month: '2-digit', day: '2-digit',
  });
}
```

---

## 8. 면책 문구 컴포넌트 (필수)

예측 섹션에 항상 렌더링해야 하는 필수 컴포넌트.
제거하거나 숨김 처리 금지.

```tsx
// components/forecast/Disclaimer.tsx
export function Disclaimer() {
  return (
    <p className="text-xs text-gray-500 mt-4 border-t pt-3">
      ⚠️ 본 예측은 통계적 추세 분석에 기반한 참고 정보이며,
      투자 조언이 아닙니다. 실제 금 가격은 다양한 요인에 의해
      예측과 다를 수 있습니다. 투자 결정은 전문가와 상담하시기 바랍니다.
    </p>
  );
}
```

---

## 9. 패키지 목록

```json
{
  "dependencies": {
    "react": "^18",
    "react-dom": "^18",
    "recharts": "^2",
    "@tanstack/react-query": "^5",
    "date-fns": "^3",
    "clsx": "^2",
    "tailwind-merge": "^2"
  },
  "devDependencies": {
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "typescript": "^5",
    "vite": "^5",
    "@vitejs/plugin-react": "^4",
    "tailwindcss": "^3",
    "autoprefixer": "^10",
    "postcss": "^8",
    "vitest": "^1",
    "@vitest/coverage-v8": "^1",
    "@testing-library/react": "^14",
    "@testing-library/jest-dom": "^6",
    "@testing-library/user-event": "^14",
    "msw": "^2",
    "eslint": "^8",
    "@typescript-eslint/parser": "^7",
    "@typescript-eslint/eslint-plugin": "^7"
  }
}
```

---

## 10. 스킬 체크리스트

구현 시 각 항목을 순서대로 완료:

### Phase 1 — 기반 설정
- [ ] Vite + React + TypeScript 프로젝트 생성
- [ ] Tailwind CSS 설정
- [ ] Recharts 설치
- [ ] `.env` / `.env.example` 생성
- [ ] `types/gold.ts` 타입 정의

### Phase 2 — 계산기 (1구역)
- [ ] `utils/goldCalc.ts` 순수 함수 구현
- [ ] `useGoldPrice` 훅 구현
- [ ] `useExchangeRate` 훅 구현
- [ ] `UnitSelector`, `PuritySelector`, `PriceDisplay` 컴포넌트
- [ ] `GoldCalculator` 통합 + 실시간 계산 동작 확인

### Phase 3 — 시세 변동 내역 (2구역)
- [ ] `useGoldHistory` 훅 구현 (기간별 fetch)
- [ ] `PriceChart` 이중 Y축 라인 차트
- [ ] `PriceSummary` 최고/최저/평균 배지
- [ ] `PriceTable` 등락 색상 테이블

### Phase 4 — 예측 (3구역)
- [ ] `utils/forecast.ts` MA + 선형 회귀 구현
- [ ] `useForecast` 훅 구현
- [ ] `ForecastChart` 실선+점선+신뢰구간 차트
- [ ] `MarketSignals` 시장 신호 텍스트
- [ ] `Disclaimer` 면책 문구 (필수)

### Phase 5 — 마무리
- [ ] 반응형 레이아웃 모바일 테스트
- [ ] API 에러 시나리오 테스트 (오프라인, 키 없음)
- [ ] 빌드 최적화 (`npm run build`)
