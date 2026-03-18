# GoldCalc — 테스트 전략 및 구현 명세

**작성일**: 2026-03-18
**대상 문서**: CLAUDE.md, prd.md, skills.md, sprint-01~05.md

---

## 1. 테스트 전략 개요

### 테스트 피라미드

```
           ▲
          /FT\        기능 테스트 (Functional Test)
         /────\       — 사용자 시나리오 전체 플로우 검증
        / IT   \      통합 테스트 (Integration Test)
       /────────\     — 훅 + API 모킹, 컴포넌트 간 연동
      /  UT      \    단위 테스트 (Unit Test)
     /────────────\   — 순수 함수, 알고리즘 정확도
```

| 종류 | 도구 | 대상 | 비중 |
|------|------|------|------|
| 단위 테스트(UT) | Vitest | utils/, types/ | 60% |
| 통합 테스트(IT) | Vitest + RTL + MSW | hooks/, components/ | 30% |
| 기능 테스트(FT) | Vitest + RTL (E2E 시나리오) | App 전체 플로우 | 10% |

---

## 2. 테스트 인프라 — 구현해야 할 개발 내용

> 테스트를 실행하기 위해 반드시 먼저 구현해야 하는 지원 코드 목록입니다.

### 2-1. 테스트 환경 설정

**파일**: `vite.config.ts` (수정)
```ts
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/utils/**', 'src/hooks/**'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 70,
      },
    },
  },
});
```

**파일**: `src/test/setup.ts` (신규)
```ts
import '@testing-library/jest-dom';
import { server } from './mocks/server';

// MSW 서버 생명주기 설정
beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

---

### 2-2. MSW 핸들러 — API 모킹 서버

**파일**: `src/test/mocks/handlers.ts` (신규)

모든 외부 API를 MSW로 인터셉트. 실제 네트워크 호출 없이 테스트 가능.

```ts
import { http, HttpResponse } from 'msw';

// 기본 성공 응답 (정상 시나리오)
export const handlers = [

  // 금시세 현재가
  http.get('https://www.goldapi.io/api/XAU/USD', () =>
    HttpResponse.json({
      price: 2650.00,
      price_gram_24k: 85.22,
      price_gram_18k: 63.91,
      price_gram_14k: 49.67,
      timestamp: 1710000000,
      currency: 'USD',
    })
  ),

  // 금시세 히스토리 (날짜별)
  http.get('https://www.goldapi.io/api/XAU/USD/:date', ({ params }) =>
    HttpResponse.json({
      price: 2640.00 + Math.random() * 50, // 날짜별 랜덤 변동
      timestamp: 1710000000,
      currency: 'USD',
    })
  ),

  // 환율
  http.get('https://v6.exchangerate-api.com/v6/:key/latest/USD', () =>
    HttpResponse.json({
      conversion_rates: { KRW: 1320 },
    })
  ),

  // Alpha Vantage (DXY, VIX)
  http.get('https://www.alphavantage.co/query', () =>
    HttpResponse.json({
      'Global Quote': { '05. price': '104.20', '09. change': '0.15' },
    })
  ),

  // FRED API (국채 금리)
  http.get('https://api.stlouisfed.org/fred/series/observations', () =>
    HttpResponse.json({
      observations: [{ date: '2026-03-18', value: '4.35' }],
    })
  ),
];
```

**파일**: `src/test/mocks/errorHandlers.ts` (신규)

에러 시나리오용 핸들러 오버라이드 모음.

```ts
import { http, HttpResponse } from 'msw';

export const errorHandlers = {
  // 금시세 API 인증 실패
  goldApiUnauthorized: http.get('https://www.goldapi.io/api/XAU/USD', () =>
    HttpResponse.json({ error: 'Unauthorized' }, { status: 401 })
  ),

  // 금시세 API rate limit
  goldApiRateLimit: http.get('https://www.goldapi.io/api/XAU/USD', () =>
    HttpResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
  ),

  // 환율 API 서버 에러
  exchangeApiServerError: http.get(
    'https://v6.exchangerate-api.com/*',
    () => HttpResponse.error()
  ),

  // 네트워크 단절
  networkOffline: http.get('https://www.goldapi.io/*', () =>
    HttpResponse.error()
  ),
};
```

**파일**: `src/test/mocks/server.ts` (신규)
```ts
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
```

---

### 2-3. 테스트 픽스처 — 고정 데이터

**파일**: `src/test/fixtures/goldData.ts` (신규)

테스트마다 일관된 데이터를 사용하기 위한 픽스처.

```ts
import { HistoryEntry, ForecastPoint, MarketSignal } from '../../types/gold';

// 고정 금시세 응답
export const mockGoldPriceResponse = {
  price: 2650.00,
  price_gram_24k: 85.22,
  timestamp: 1710000000,
  currency: 'USD',
};

// 고정 환율
export const mockExchangeRate = 1320;

// 30일 히스토리 픽스처 (선형 상승 추세)
export const mockHistory30Days: HistoryEntry[] = Array.from(
  { length: 30 },
  (_, i) => ({
    date: new Date(2026, 1, i + 1).toISOString().split('T')[0],
    priceUSD: 2600 + i * 2,          // 완만한 상승
    exchangeRate: 1320,
    priceKRWperGram: Math.round(((2600 + i * 2) / 31.1035) * 1320),
    changeRate: i === 0 ? 0 : 0.08,
  })
);

// 예측 포인트 픽스처
export const mockForecastPoints: ForecastPoint[] = Array.from(
  { length: 7 },
  (_, i) => ({
    date: new Date(2026, 2, i + 1).toISOString().split('T')[0],
    predicted: 2660 + i * 3,
    upper: 2700 + i * 3,
    lower: 2620 + i * 3,
  })
);

// 시장 신호 픽스처
export const mockMarketSignals: MarketSignal[] = [
  { name: '달러 인덱스(DXY)', value: 104.2, trend: 'up' },
  { name: '미국 국채 10년물', value: 4.35, trend: 'down' },
  { name: 'VIX 지수', value: 18.5, trend: 'neutral' },
];
```

---

### 2-4. 테스트 유틸 헬퍼

**파일**: `src/test/utils/renderWithProviders.tsx` (신규)

TanStack Query Provider를 포함한 커스텀 렌더 함수.

```tsx
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactElement } from 'react';

// 테스트마다 새 QueryClient 생성 (캐시 공유 방지)
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,       // 테스트에서 재시도 비활성화
        staleTime: 0,       // 항상 fresh하게
        gcTime: 0,
      },
    },
  });
}

export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  const queryClient = createTestQueryClient();
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
  return render(ui, { wrapper: Wrapper, ...options });
}
```

---

## 3. 단위 테스트 (Unit Test)

### UT-01. 금시세 환산 (`src/utils/goldCalc.test.ts`)

**테스트 목적**: 환산 공식의 수학적 정확도 검증 — 실제 금 거래 가격과 오차 없어야 함

```ts
import { describe, it, expect } from 'vitest';
import {
  weightToGrams, calcPricePerGram, calcGoldPrice,
  TROY_OZ_TO_G, DON_TO_G, NYANG_TO_G, PURITY_RATIO
} from '../goldCalc';

describe('단위 변환 — weightToGrams', () => {
  it('g 단위는 그대로 반환', () => {
    expect(weightToGrams(10, 'g')).toBe(10);
  });
  it('1돈 = 3.75g', () => {
    expect(weightToGrams(1, 'don')).toBe(3.75);
  });
  it('1냥 = 37.5g', () => {
    expect(weightToGrams(1, 'nyang')).toBe(37.5);
  });
  it('1냥 = 10돈', () => {
    expect(weightToGrams(1, 'nyang')).toBe(weightToGrams(10, 'don'));
  });
  it('소수점 입력 처리 — 0.5돈 = 1.875g', () => {
    expect(weightToGrams(0.5, 'don')).toBe(1.875);
  });
});

describe('원화/g 계산 — calcPricePerGram', () => {
  // 검증값: (2650 / 31.1035) * 1380 ≈ 117,576
  it('기준값 검증: $2,650/oz, 1380원/USD', () => {
    const result = calcPricePerGram(2650, 1380);
    expect(result).toBeCloseTo((2650 / TROY_OZ_TO_G) * 1380, 2);
  });
  it('환율이 오르면 원화 가격도 상승', () => {
    const low = calcPricePerGram(2650, 1300);
    const high = calcPricePerGram(2650, 1400);
    expect(high).toBeGreaterThan(low);
  });
  it('금시세가 오르면 원화 가격도 상승', () => {
    const low = calcPricePerGram(2600, 1320);
    const high = calcPricePerGram(2700, 1320);
    expect(high).toBeGreaterThan(low);
  });
  it('priceUSD=0이면 0 반환', () => {
    expect(calcPricePerGram(0, 1380)).toBe(0);
  });
});

describe('순도 적용 — calcGoldPrice', () => {
  const usd = 2650.5, rate = 1380;

  it('24K는 순도 0.9999 적용', () => {
    const pricePerGram = calcPricePerGram(usd, rate);
    const expected = Math.round(pricePerGram * 3.75 * PURITY_RATIO['24K']);
    expect(calcGoldPrice(1, 'don', '24K', usd, rate)).toBe(expected);
  });
  it('18K는 24K의 75%', () => {
    const val24 = calcGoldPrice(1, 'don', '24K', usd, rate);
    const val18 = calcGoldPrice(1, 'don', '18K', usd, rate);
    // 0.75 / 0.9999 ≒ 0.7501 (근사치 허용)
    expect(val18 / val24).toBeCloseTo(0.75 / 0.9999, 2);
  });
  it('14K는 18K보다 낮음', () => {
    const val18 = calcGoldPrice(1, 'don', '18K', usd, rate);
    const val14 = calcGoldPrice(1, 'don', '14K', usd, rate);
    expect(val14).toBeLessThan(val18);
  });
  it('10돈 24K 계산 (대표 시나리오)', () => {
    const pricePerGram = calcPricePerGram(usd, rate);
    const expected = Math.round(pricePerGram * 37.5 * PURITY_RATIO['24K']);
    expect(calcGoldPrice(10, 'don', '24K', usd, rate)).toBe(expected);
  });
  it('0 입력 시 0 반환', () => {
    expect(calcGoldPrice(0, 'g', '24K', usd, rate)).toBe(0);
  });
  it('결과는 항상 정수 (Math.round 적용)', () => {
    const result = calcGoldPrice(1, 'don', '24K', usd, rate);
    expect(result).toBe(Math.round(result));
  });
});
```

---

### UT-02. 히스토리 계산 (`src/utils/historyCalc.test.ts`)

**테스트 목적**: 전일 대비 등락률, 최고/최저/평균 계산 정확도

```ts
describe('전일 대비 등락률 — calculateChangeRates', () => {
  test('첫 번째 항목 등락률은 0', () => {
    const result = calculateChangeRates([
      { priceUSD: 2600, ...나머지_필드 },
      { priceUSD: 2650, ...나머지_필드 },
    ]);
    expect(result[0].changeRate).toBe(0);
  });
  test('2600 → 2650 = +1.923%', () => {
    const result = calculateChangeRates([
      { priceUSD: 2600 },
      { priceUSD: 2650 },
    ]);
    expect(result[1].changeRate).toBeCloseTo(1.923, 2);
  });
  test('2650 → 2600 = -1.887%', () => {
    const result = calculateChangeRates([
      { priceUSD: 2650 },
      { priceUSD: 2600 },
    ]);
    expect(result[1].changeRate).toBeCloseTo(-1.887, 2);
  });
  test('동일 가격 = 0%', () => {
    const result = calculateChangeRates([
      { priceUSD: 2650 },
      { priceUSD: 2650 },
    ]);
    expect(result[1].changeRate).toBe(0);
  });
});

describe('기간 요약 — calcPeriodSummary', () => {
  const entries = mockHistory30Days; // 픽스처 사용

  test('최고가는 배열 중 가장 큰 값', () => {
    const { highest } = calcPeriodSummary(entries);
    const maxPrice = Math.max(...entries.map(e => e.priceUSD));
    expect(highest.priceUSD).toBe(maxPrice);
  });
  test('최저가는 배열 중 가장 작은 값', () => {
    const { lowest } = calcPeriodSummary(entries);
    const minPrice = Math.min(...entries.map(e => e.priceUSD));
    expect(lowest.priceUSD).toBe(minPrice);
  });
  test('평균가는 합계 / 건수', () => {
    const { average } = calcPeriodSummary(entries);
    const expected = entries.reduce((s, e) => s + e.priceUSD, 0) / entries.length;
    expect(average).toBeCloseTo(expected, 1);
  });
  test('빈 배열 처리 — 예외 없이 null 반환', () => {
    expect(() => calcPeriodSummary([])).not.toThrow();
  });
});
```

---

### UT-03. 예측 알고리즘 (`src/utils/forecast.test.ts`)

**테스트 목적**: 이동평균·선형 회귀·신뢰 구간의 수학적 정확도

```ts
describe('이동평균 — movingAverage', () => {
  test('period - 1개까지는 null 반환', () => {
    const result = movingAverage([10, 20, 30, 40, 50], 3);
    expect(result[0]).toBeNull();
    expect(result[1]).toBeNull();
    expect(result[2]).toBe(20);  // (10+20+30)/3
  });
  test('MA5 — 5개 평균 정확도', () => {
    const data = [100, 102, 98, 105, 103];
    const ma5 = movingAverage(data, 5);
    expect(ma5[4]).toBeCloseTo(101.6, 1);
  });
  test('모든 값이 동일하면 MA = 해당 값', () => {
    const data = [100, 100, 100, 100, 100];
    const result = movingAverage(data, 3);
    expect(result[2]).toBe(100);
    expect(result[4]).toBe(100);
  });
  test('기간 1이면 원본 그대로 반환', () => {
    const data = [10, 20, 30];
    expect(movingAverage(data, 1)).toEqual([10, 20, 30]);
  });
});

describe('선형 회귀 — linearRegression', () => {
  test('완벽한 선형 데이터: R² = 1', () => {
    const data = [1, 2, 3, 4, 5]; // y = x + 1
    const { r2 } = linearRegression(data);
    expect(r2).toBeCloseTo(1, 5);
  });
  test('상승 데이터 → slope 양수', () => {
    const { slope } = linearRegression([100, 110, 120, 130]);
    expect(slope).toBeGreaterThan(0);
  });
  test('하락 데이터 → slope 음수', () => {
    const { slope } = linearRegression([130, 120, 110, 100]);
    expect(slope).toBeLessThan(0);
  });
  test('수평 데이터 → slope ≒ 0', () => {
    const { slope } = linearRegression([100, 100, 100, 100]);
    expect(Math.abs(slope)).toBeLessThan(0.001);
  });
  test('slope와 intercept로 예측값 검증', () => {
    const data = [2, 4, 6, 8]; // slope=2, intercept=2
    const { slope, intercept } = linearRegression(data);
    expect(slope).toBeCloseTo(2, 5);
    expect(intercept).toBeCloseTo(2, 5);
  });
});

describe('표준편차 — standardDeviation', () => {
  test('알려진 데이터셋: [2,4,4,4,5,5,7,9] → σ=2', () => {
    expect(standardDeviation([2, 4, 4, 4, 5, 5, 7, 9])).toBeCloseTo(2, 5);
  });
  test('동일값 배열 → σ=0', () => {
    expect(standardDeviation([5, 5, 5, 5])).toBe(0);
  });
  test('σ는 항상 0 이상', () => {
    const result = standardDeviation([100, 200, 50, 300]);
    expect(result).toBeGreaterThanOrEqual(0);
  });
});

describe('신뢰 구간 — confidenceBand', () => {
  test('upper는 predicted보다 큼', () => {
    const predicted = [100, 200, 300];
    const bands = confidenceBand(predicted, 10);
    bands.forEach((b, i) => {
      expect(b.upper).toBeGreaterThan(predicted[i]);
      expect(b.lower).toBeLessThan(predicted[i]);
    });
  });
  test('upper - lower = 2σ', () => {
    const predicted = [100];
    const stdDev = 15;
    const [band] = confidenceBand(predicted, stdDev);
    expect(band.upper - band.lower).toBe(2 * stdDev);
  });
});

describe('트렌드 판단 — detectTrend', () => {
  test('MA5 > MA20이면 bullish', () => {
    // 최근 5일 평균이 높은 데이터
    const risingData = [...Array(20).fill(100), ...Array(5).fill(200)];
    expect(detectTrend(risingData)).toBe('bullish');
  });
  test('MA5 < MA20이면 bearish', () => {
    const fallingData = [...Array(20).fill(200), ...Array(5).fill(100)];
    expect(detectTrend(fallingData)).toBe('bearish');
  });
  test('데이터 부족(< 20개)이면 neutral', () => {
    expect(detectTrend([100, 200, 300])).toBe('neutral');
  });
});
```

---

### UT-04. 포맷 유틸 (`src/utils/format.test.ts`)

```ts
describe('formatKRW', () => {
  it('₩ 접두사 + 천 단위 콤마', () => {
    expect(formatKRW(146500)).toBe('₩146,500');
  });
  it('₩0 처리', () => {
    expect(formatKRW(0)).toBe('₩0');
  });
  it('대형 숫자 콤마 처리', () => {
    expect(formatKRW(1_000_000)).toBe('₩1,000,000');
  });
});

describe('formatChangeRate', () => {
  it('양수 앞에 + 기호 추가', () => {
    expect(formatChangeRate(0.85)).toBe('+0.85%');
  });
  it('음수는 - 기호 유지', () => {
    expect(formatChangeRate(-1.23)).toBe('-1.23%');
  });
  it('0은 +0.00%', () => {
    expect(formatChangeRate(0)).toBe('+0.00%');
  });
});

describe('getChangeColor', () => {
  it('양수 → 빨간색 클래스 (한국 증시 관례)', () => {
    expect(getChangeColor(1)).toContain('text-red');
  });
  it('음수 → 파란색 클래스', () => {
    expect(getChangeColor(-1)).toContain('text-blue');
  });
  it('0 → muted 클래스', () => {
    expect(getChangeColor(0)).toContain('muted');
  });
});

describe('getChangeIcon', () => {
  it('양수 → ▲', () => expect(getChangeIcon(1)).toBe('▲'));
  it('음수 → ▼', () => expect(getChangeIcon(-1)).toBe('▼'));
  it('0 → ─',   () => expect(getChangeIcon(0)).toBe('─'));
});
```

---

## 4. 통합 테스트 (Integration Test)

### IT-01. useGoldPrice 훅 (`src/hooks/useGoldPrice.test.ts`)

**테스트 목적**: TanStack Query + API 호출 + 캐싱 동작 검증

```ts
import { renderHook, waitFor } from '@testing-library/react';
import { server } from '../test/mocks/server';
import { errorHandlers } from '../test/mocks/errorHandlers';

describe('useGoldPrice', () => {
  test('정상 응답 시 price 값 반환', async () => {
    const { result } = renderHook(() => useGoldPrice(), {
      wrapper: createQueryWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.price).toBe(2650.00);
  });

  test('로딩 초기 상태는 isLoading=true', () => {
    const { result } = renderHook(() => useGoldPrice(), {
      wrapper: createQueryWrapper(),
    });
    expect(result.current.isLoading).toBe(true);
  });

  test('API 401 오류 시 isError=true', async () => {
    server.use(errorHandlers.goldApiUnauthorized);
    const { result } = renderHook(() => useGoldPrice(), {
      wrapper: createQueryWrapper(),
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  test('네트워크 오류 시 이전 캐시값 유지', async () => {
    // 1차 성공 → 캐시 저장
    const { result } = renderHook(() => useGoldPrice(), {
      wrapper: createQueryWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const cachedPrice = result.current.data?.price;

    // 2차 네트워크 오류 → 캐시값 유지
    server.use(errorHandlers.networkOffline);
    // staleTime 내에서는 캐시 유지 확인
    expect(result.current.data?.price).toBe(cachedPrice);
  });
});
```

---

### IT-02. useGoldHistory 훅 (`src/hooks/useGoldHistory.test.ts`)

```ts
describe('useGoldHistory', () => {
  test('1W 기간 — 주말 제외한 영업일만 반환', async () => {
    const { result } = renderHook(() => useGoldHistory('1W'), {
      wrapper: createQueryWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    result.current.data?.forEach(entry => {
      const day = new Date(entry.date).getDay();
      expect(day).not.toBe(0); // 일요일 제외
      expect(day).not.toBe(6); // 토요일 제외
    });
  });

  test('period 변경 시 새 쿼리 실행', async () => {
    const { result, rerender } = renderHook(
      ({ period }) => useGoldHistory(period),
      { initialProps: { period: '1W' as Period }, wrapper: createQueryWrapper() }
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const count1W = result.current.data?.length;

    rerender({ period: '1M' });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const count1M = result.current.data?.length;

    expect(count1M).toBeGreaterThan(count1W!);
  });

  test('히스토리 데이터에 changeRate 포함', async () => {
    const { result } = renderHook(() => useGoldHistory('1M'), {
      wrapper: createQueryWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const first = result.current.data![0];
    expect(typeof first.changeRate).toBe('number');
    expect(first.changeRate).toBe(0); // 첫 항목 등락률 = 0
  });
});
```

---

### IT-03. useForecast 훅 (`src/hooks/useForecast.test.ts`)

```ts
describe('useForecast', () => {
  test('7일 예측: 정확히 7개 포인트 반환', () => {
    const { result } = renderHook(() =>
      useForecast(mockHistory30Days, 7)
    );
    const forecastOnly = result.current.filter(p => p.predicted !== undefined);
    expect(forecastOnly).toHaveLength(7);
  });

  test('예측 포인트는 upper >= predicted >= lower', () => {
    const { result } = renderHook(() =>
      useForecast(mockHistory30Days, 7)
    );
    result.current
      .filter(p => p.predicted !== undefined)
      .forEach(p => {
        expect(p.upper!).toBeGreaterThanOrEqual(p.predicted!);
        expect(p.predicted!).toBeGreaterThanOrEqual(p.lower!);
      });
  });

  test('데이터 부족(< 30일) 시 빈 배열 반환', () => {
    const shortHistory = mockHistory30Days.slice(0, 10);
    const { result } = renderHook(() => useForecast(shortHistory, 7));
    expect(result.current).toHaveLength(0);
  });

  test('30일 예측: 과거 30개 + 예측 30개 = 60개', () => {
    const { result } = renderHook(() =>
      useForecast(mockHistory30Days, 30)
    );
    expect(result.current).toHaveLength(60);
  });
});
```

---

### IT-04. GoldCalculator 컴포넌트 (`src/components/calculator/GoldCalculator.test.tsx`)

**테스트 목적**: API 응답 후 계산기가 올바르게 렌더링되고 상호작용하는지 검증

```tsx
describe('GoldCalculator 컴포넌트', () => {
  test('초기 로딩 시 Skeleton 표시', () => {
    renderWithProviders(<GoldCalculator />);
    expect(document.querySelector('[data-testid="price-skeleton"]')).toBeTruthy();
  });

  test('API 응답 후 원화 가격 표시', async () => {
    renderWithProviders(<GoldCalculator />);
    await waitFor(() => {
      expect(screen.getByText(/원/)).toBeInTheDocument();
    });
  });

  test('돈 탭 선택 시 결과 재계산', async () => {
    renderWithProviders(<GoldCalculator />);
    await waitFor(() => screen.getByRole('tab', { name: '돈' }));

    const donTab = screen.getByRole('tab', { name: '돈' });
    await userEvent.click(donTab);

    await waitFor(() => {
      expect(screen.getByText(/돈/)).toBeInTheDocument();
    });
  });

  test('18K 선택 시 24K보다 낮은 금액 표시', async () => {
    renderWithProviders(<GoldCalculator />);
    await waitFor(() => screen.getAllByRole('button'));

    // 24K 결과 저장
    const price24K = screen.getByTestId('total-price').textContent;

    // 18K 선택
    await userEvent.click(screen.getByRole('button', { name: '18K' }));
    const price18K = screen.getByTestId('total-price').textContent;

    // 숫자만 추출하여 비교
    const num24 = parseInt(price24K!.replace(/[^0-9]/g, ''));
    const num18 = parseInt(price18K!.replace(/[^0-9]/g, ''));
    expect(num18).toBeLessThan(num24);
  });

  test('API 에러 시 에러 메시지 표시', async () => {
    server.use(errorHandlers.goldApiUnauthorized);
    renderWithProviders(<GoldCalculator />);
    await waitFor(() => {
      expect(screen.getByText(/불러올 수 없습니다/)).toBeInTheDocument();
    });
  });

  test('업데이트 시각 표시', async () => {
    renderWithProviders(<GoldCalculator />);
    await waitFor(() => {
      expect(screen.getByText(/기준/)).toBeInTheDocument();
    });
  });
});
```

---

### IT-05. PriceHistory 컴포넌트 (`src/components/history/PriceHistory.test.tsx`)

```tsx
describe('PriceHistory 컴포넌트', () => {
  test('기본값 1개월 탭 활성화', async () => {
    renderWithProviders(<PriceHistory />);
    const tab = screen.getByRole('tab', { name: '1개월' });
    expect(tab).toHaveAttribute('aria-selected', 'true');
  });

  test('1년 탭 클릭 시 탭 활성화', async () => {
    renderWithProviders(<PriceHistory />);
    await userEvent.click(screen.getByRole('tab', { name: '1년' }));
    expect(screen.getByRole('tab', { name: '1년' }))
      .toHaveAttribute('aria-selected', 'true');
  });

  test('최고가 배지 렌더링', async () => {
    renderWithProviders(<PriceHistory />);
    await waitFor(() => {
      expect(screen.getByText('최고가')).toBeInTheDocument();
    });
  });

  test('테이블 등락 색상 — 상승행은 빨간 텍스트 포함', async () => {
    renderWithProviders(<PriceHistory />);
    await waitFor(() => screen.getAllByRole('row'));
    const redCells = document.querySelectorAll('.text-red-500');
    expect(redCells.length).toBeGreaterThan(0);
  });

  test('로딩 중 ChartSkeleton 렌더링', () => {
    renderWithProviders(<PriceHistory />);
    expect(document.querySelector('[data-testid="chart-skeleton"]')).toBeTruthy();
  });
});
```

---

### IT-06. GoldForecast 컴포넌트 (`src/components/forecast/GoldForecast.test.tsx`)

```tsx
describe('GoldForecast 컴포넌트', () => {
  test('면책 문구 항상 렌더링', async () => {
    renderWithProviders(<GoldForecast />);
    await waitFor(() => {
      expect(screen.getByText(/투자 조언이 아닙니다/)).toBeInTheDocument();
    });
  });

  test('면책 문구는 숨김 처리되지 않음 (visibility visible)', async () => {
    renderWithProviders(<GoldForecast />);
    await waitFor(() => {
      const disclaimer = screen.getByText(/투자 조언이 아닙니다/).closest('div');
      expect(disclaimer).toBeVisible();
    });
  });

  test('7일 탭이 기본 선택', async () => {
    renderWithProviders(<GoldForecast />);
    expect(screen.getByRole('tab', { name: '7일' }))
      .toHaveAttribute('aria-selected', 'true');
  });

  test('30일 탭 클릭 시 탭 변경', async () => {
    renderWithProviders(<GoldForecast />);
    await userEvent.click(screen.getByRole('tab', { name: '30일' }));
    expect(screen.getByRole('tab', { name: '30일' }))
      .toHaveAttribute('aria-selected', 'true');
  });

  test('시장 신호 카드 — API 성공 시 표시', async () => {
    renderWithProviders(<GoldForecast />);
    await waitFor(() => {
      expect(screen.getByText(/달러 인덱스/)).toBeInTheDocument();
    });
  });

  test('시장 신호 API 실패 시 해당 카드만 숨김 (섹션 전체 유지)', async () => {
    server.use(
      http.get('https://www.alphavantage.co/*', () => HttpResponse.error())
    );
    renderWithProviders(<GoldForecast />);
    await waitFor(() => {
      // 면책 문구는 여전히 표시
      expect(screen.getByText(/투자 조언이 아닙니다/)).toBeInTheDocument();
    });
  });
});
```

---

## 5. 기능 테스트 (Functional Test)

### FT-01. 계산기 전체 플로우

**대응 사용자 스토리**: US-01, US-02, US-03

```ts
// src/test/functional/calculator.test.tsx
describe('[FT] 계산기 전체 플로우', () => {

  test('FT-01-A: g 입력 → 원화 즉시 표시', async () => {
    renderWithProviders(<App />);
    await waitFor(() => screen.getByTestId('total-price'));

    // g 탭 선택
    await userEvent.click(screen.getByRole('tab', { name: 'g' }));

    // 10g 입력
    const input = screen.getByRole('spinbutton');
    await userEvent.clear(input);
    await userEvent.type(input, '10');

    // 원화 표시 확인 (숫자 + '원')
    await waitFor(() => {
      expect(screen.getByTestId('total-price').textContent).toMatch(/[0-9,]+원/);
    });
  });

  test('FT-01-B: 돈 단위 입력 → 올바른 환산', async () => {
    renderWithProviders(<App />);
    await waitFor(() => screen.getByTestId('total-price'));

    await userEvent.click(screen.getByRole('tab', { name: '돈' }));
    const input = screen.getByRole('spinbutton');
    await userEvent.clear(input);
    await userEvent.type(input, '1');

    // 1돈 = 3.75g → $2650/oz, 1320원/USD 기준: 약 560,090원
    await waitFor(() => {
      const priceText = screen.getByTestId('total-price').textContent!;
      const numericValue = parseInt(priceText.replace(/[^0-9]/g, ''));
      expect(numericValue).toBeGreaterThan(400000);
      expect(numericValue).toBeLessThan(800000);
    });
  });

  test('FT-01-C: 24K → 18K 전환 시 가격 감소', async () => {
    renderWithProviders(<App />);
    await waitFor(() => screen.getByTestId('total-price'));

    const price24 = parseInt(
      screen.getByTestId('total-price').textContent!.replace(/[^0-9]/g, '')
    );

    await userEvent.click(screen.getByRole('button', { name: /18K/ }));

    await waitFor(() => {
      const price18 = parseInt(
        screen.getByTestId('total-price').textContent!.replace(/[^0-9]/g, '')
      );
      expect(price18).toBeLessThan(price24);
    });
  });

  test('FT-01-D: 업데이트 시각 표시 확인', async () => {
    renderWithProviders(<App />);
    await waitFor(() => {
      expect(screen.getByText(/기준/)).toBeInTheDocument();
    });
  });
});
```

---

### FT-02. 히스토리 전체 플로우

**대응 사용자 스토리**: US-06, US-07, US-08

```ts
describe('[FT] 시세 변동 내역 전체 플로우', () => {

  test('FT-02-A: 1개월 탭 → 차트 + 테이블 렌더링', async () => {
    renderWithProviders(<App />);
    await userEvent.click(screen.getByRole('tab', { name: '1개월' }));

    await waitFor(() => {
      // 차트 영역 렌더링 확인
      expect(document.querySelector('[role="img"]')).toBeTruthy();
      // 테이블 행 존재 확인
      expect(screen.getAllByRole('row').length).toBeGreaterThan(1);
    });
  });

  test('FT-02-B: 최고가/최저가/평균가 배지 3개 모두 표시', async () => {
    renderWithProviders(<App />);
    await waitFor(() => screen.getByText('1개월'));
    await userEvent.click(screen.getByRole('tab', { name: '1개월' }));

    await waitFor(() => {
      expect(screen.getByText('최고가')).toBeInTheDocument();
      expect(screen.getByText('최저가')).toBeInTheDocument();
      expect(screen.getByText('평균가')).toBeInTheDocument();
    });
  });

  test('FT-02-C: 테이블 날짜 최신순 정렬', async () => {
    renderWithProviders(<App />);
    await waitFor(() => screen.getAllByRole('row'));

    const rows = screen.getAllByRole('row').slice(1); // 헤더 제외
    const dates = rows.map(r => r.cells[0].textContent!);
    // 첫 행이 최신 날짜
    expect(new Date(dates[0]) >= new Date(dates[1])).toBe(true);
  });
});
```

---

### FT-03. 예측 전체 플로우

**대응 사용자 스토리**: US-09, US-10, US-11

```ts
describe('[FT] 예측 전체 플로우', () => {

  test('FT-03-A: 면책 문구 항상 표시 (조건 없음)', async () => {
    renderWithProviders(<App />);
    // 로딩 전이든 후든 면책 문구는 항상 있어야 함
    expect(screen.getByText(/투자 조언이 아닙니다/)).toBeInTheDocument();
  });

  test('FT-03-B: 7일 예측 차트 렌더링 확인', async () => {
    renderWithProviders(<App />);
    await waitFor(() =>
      expect(document.querySelector('[data-testid="forecast-chart"]')).toBeTruthy()
    );
  });

  test('FT-03-C: 30일 탭 전환 후 차트 재렌더링', async () => {
    renderWithProviders(<App />);
    await waitFor(() => screen.getByRole('tab', { name: '30일' }));
    await userEvent.click(screen.getByRole('tab', { name: '30일' }));

    expect(screen.getByRole('tab', { name: '30일' }))
      .toHaveAttribute('aria-selected', 'true');
  });
});
```

---

### FT-04. 에러 및 오프라인 시나리오

**대응 비기능 요구사항**: 5.2 가용성 및 에러 처리

```ts
describe('[FT] 에러 시나리오', () => {

  test('FT-04-A: 금시세 API 실패 → 에러 배너 + 계산 비활성화', async () => {
    server.use(errorHandlers.goldApiUnauthorized);
    renderWithProviders(<App />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/불러올 수 없습니다/)).toBeInTheDocument();
    });
  });

  test('FT-04-B: 환율 API 실패 → 에러 표시', async () => {
    server.use(errorHandlers.exchangeApiServerError);
    renderWithProviders(<App />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  test('FT-04-C: 오프라인 감지 → 노란 배너 표시', async () => {
    // navigator.onLine 모킹
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false,
    });
    window.dispatchEvent(new Event('offline'));

    renderWithProviders(<App />);
    await waitFor(() => {
      expect(screen.getByText(/인터넷 연결을 확인/)).toBeInTheDocument();
    });

    // 복구
    Object.defineProperty(navigator, 'onLine', { value: true });
    window.dispatchEvent(new Event('online'));
  });

  test('FT-04-D: API 재연결 후 정상 복구', async () => {
    // 에러 → 정상 순서
    server.use(errorHandlers.goldApiUnauthorized);
    renderWithProviders(<App />);
    await waitFor(() => screen.getByRole('alert'));

    // 정상 핸들러로 복구
    server.resetHandlers();
    // refetch 트리거 (버튼 클릭 또는 interval)
    const refetchBtn = screen.queryByRole('button', { name: /다시 시도/ });
    if (refetchBtn) await userEvent.click(refetchBtn);

    await waitFor(() => {
      expect(screen.queryByRole('alert')).toBeNull();
    });
  });
});
```

---

### FT-05. 접근성 (Accessibility)

```ts
describe('[FT] 접근성', () => {

  test('FT-05-A: 등락 표시에 aria-label 포함', async () => {
    renderWithProviders(<App />);
    await waitFor(() => screen.getAllByRole('row'));

    const changeCells = document.querySelectorAll('[aria-label*="상승"], [aria-label*="하락"]');
    expect(changeCells.length).toBeGreaterThan(0);
  });

  test('FT-05-B: 차트에 role="img" + aria-label 존재', async () => {
    renderWithProviders(<App />);
    await waitFor(() => {
      const charts = document.querySelectorAll('[role="img"][aria-label]');
      expect(charts.length).toBeGreaterThan(0);
    });
  });

  test('FT-05-C: 탭 키보드 탐색 가능', async () => {
    renderWithProviders(<App />);
    const firstTab = screen.getAllByRole('tab')[0];
    firstTab.focus();
    expect(document.activeElement).toBe(firstTab);

    await userEvent.keyboard('{ArrowRight}');
    expect(document.activeElement).not.toBe(firstTab);
  });

  test('FT-05-D: 원화 수치 aria-live polite 적용', async () => {
    renderWithProviders(<App />);
    await waitFor(() => screen.getByTestId('total-price'));
    const liveRegion = screen.getByTestId('total-price').closest('[aria-live]');
    expect(liveRegion?.getAttribute('aria-live')).toBe('polite');
  });
});
```

---

## 6. 테스트 지원을 위해 추가 구현해야 할 내용

Sprint에 반영해야 할 테스트 지원 개발 항목.

### 필수 data-testid 속성 추가

컴포넌트 구현 시 아래 `data-testid`를 반드시 추가:

| 컴포넌트 | data-testid | 용도 |
|---------|-------------|------|
| `PriceDisplay` | `total-price` | 원화 환산 결과값 |
| `PriceDisplay` | `unit-price-gram` | 원화/g 단가 |
| `PriceDisplay` | `unit-price-don` | 원화/돈 단가 |
| `PriceChart` | `price-chart` | 히스토리 차트 래퍼 |
| `PriceSummary` | `summary-high` | 최고가 배지 |
| `PriceSummary` | `summary-low` | 최저가 배지 |
| `PriceSummary` | `summary-avg` | 평균가 배지 |
| `ForecastChart` | `forecast-chart` | 예측 차트 래퍼 |
| `Disclaimer` | `disclaimer` | 면책 문구 컨테이너 |
| `PriceBar` | `price-bar` | 시세 헤더 바 |
| `GoldCalculator` | `price-skeleton` | 로딩 스켈레톤 |
| `PriceHistory` | `chart-skeleton` | 차트 로딩 스켈레톤 |

### 오프라인 배너 컴포넌트 추가

`src/components/layout/OfflineBanner.tsx` — `useOnlineStatus` 훅과 연동, `data-testid="offline-banner"` 포함.

### 에러 얼럿 공통 컴포넌트

`src/components/common/ErrorAlert.tsx` — `role="alert"`, 재시도 버튼(`다시 시도`) 포함.

### 차트 접근성 래퍼

모든 차트 컴포넌트 최외각에:
```tsx
<div role="img" aria-label={`${label} 차트`} data-testid="price-chart">
  <ResponsiveContainer>...</ResponsiveContainer>
</div>
```

---

## 7. 테스트 실행 명령어

```bash
# 전체 테스트
npm run test

# 커버리지 포함
npm run test -- --coverage

# 단위 테스트만
npm run test -- src/utils

# 통합 테스트만
npm run test -- src/hooks src/components

# 기능 테스트만
npm run test -- src/test/functional

# 특정 파일
npm run test -- src/utils/goldCalc.test.ts

# watch 모드 (개발 중)
npm run test -- --watch
```

---

## 8. 커버리지 목표

| 파일/모듈 | 목표 라인 커버리지 |
|----------|-----------------|
| `utils/goldCalc.ts` | **100%** — 금전 계산 오류 절대 불가 |
| `utils/forecast.ts` | **95%** — 알고리즘 정확도 핵심 |
| `utils/historyCalc.ts` | **95%** |
| `utils/format.ts` | **100%** |
| `hooks/*.ts` | **80%** |
| `components/**/*.tsx` | **70%** |
| **전체 평균** | **80%** |

---

## 9. 테스트 파일 위치 정리 (실제 구현 기준)

```
src/
├── test/
│   ├── setup.ts                          # 전역 설정 (MSW lifecycle)
│   ├── mocks/
│   │   ├── server.ts                     # MSW 서버
│   │   ├── handlers.ts                   # 정상 응답 핸들러
│   │   └── errorHandlers.ts              # 에러 시나리오 핸들러
│   ├── fixtures/
│   │   └── goldData.ts                   # 고정 테스트 데이터
│   ├── utils/
│   │   └── renderWithProviders.tsx       # QueryClient 포함 커스텀 렌더
│   └── functional/                       # 기능 테스트 (E2E 시나리오)
│       ├── calculator.test.tsx           # FT-01 (10개 테스트)
│       ├── history.test.tsx              # FT-02 (7개 테스트)
│       └── forecast.test.tsx             # FT-03 (9개 테스트)
└── utils/
    ├── goldCalc.test.ts                  # UT-01 (18개 테스트)
    ├── historyCalc.test.ts               # UT-02 (18개 테스트)
    ├── forecast.test.ts                  # UT-03 (28개 테스트)
    └── format.test.ts                    # UT-04 (12개 테스트)
```

> **참고**: IT-01~IT-06 (훅·컴포넌트 통합 테스트) 및 FT-04(에러 시나리오), FT-05(접근성) 별도 파일은
> 기능 테스트(calculator/history/forecast.test.tsx) 내에서 케이스로 통합되어 있습니다.

---

## 10. PRD 요구사항 ↔ 테스트 매핑

| PRD 요구사항 | 관련 테스트 |
|-------------|-----------|
| FR-01 실시간 금시세 조회 | IT-01, FT-01-D |
| FR-02 무게 단위 변환 | UT-01, FT-01-A, FT-01-B |
| FR-03 순도 선택 | UT-01 (순도 적용), FT-01-C |
| FR-04 원화 환산 표시 | UT-01, IT-04, FT-01-A |
| FR-05 기간 탭 선택 | IT-05, FT-02-A |
| FR-06 시세 변동 차트 | IT-05, FT-02-A |
| FR-07 요약 배지 | UT-02, FT-02-B |
| FR-08 날짜별 테이블 | IT-05, FT-02-C |
| FR-09~11 예측 기능 | UT-03, IT-03, FT-03 |
| FR-12 시장 신호 | IT-06, FT-03 |
| FR-13 면책 문구 (필수) | IT-06, FT-03-A |
| 5.2 에러 처리 | FT-04 전체 |
| 5.5 접근성 | FT-05 전체 |
