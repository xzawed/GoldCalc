# Testing — 전략·패턴·케이스 명세

---

## 테스트 실행 명령

```bash
npm test                  # 전체 실행
npm run test:watch        # watch 모드
npm run test:coverage     # 커버리지 리포트
```

---

## 테스트 피라미드

| 종류 | 도구 | 대상 | 비중 |
|------|------|------|------|
| 단위(UT) | Vitest | `src/utils/` | 60% |
| 통합(IT) | Vitest + RTL + MSW | `src/hooks/`, `src/components/` | 30% |
| 기능(FT) | Vitest + RTL | `src/test/functional/` | 10% |

**커버리지 목표:** lines 80%, functions 80%, branches 70%  
**커버리지 대상:** `src/utils/**`, `src/hooks/**`

---

## 파일 구조

```
src/test/
├── setup.ts                       — MSW 생명주기 (beforeAll/afterEach/afterAll)
├── mocks/
│   ├── server.ts                  — MSW 서버 인스턴스
│   └── handlers.ts                — 정상 응답 핸들러 (프록시 URL 기준)
├── fixtures/
│   └── goldData.ts                — 고정 테스트 데이터
├── utils/
│   └── renderWithProviders.tsx    — QueryClient 포함 커스텀 렌더
└── functional/                    — 기능 테스트 (E2E 시나리오)
```

---

## MSW 핸들러 패턴

### 기본 핸들러 (`src/test/mocks/handlers.ts`)
프록시 URL을 인터셉트. 외부 API URL 직접 사용 금지.

```ts
import { http, HttpResponse } from 'msw'

export const handlers = [
  http.get('*/api/gold-price', () =>
    HttpResponse.json({ price: 2650.5, chp: 0.85, timestamp: 1742278800 })
  ),
  http.get('*/api/gold-history', () =>
    HttpResponse.json({ timestamp: 1742192400, close: 2640.0 })
  ),
  http.get('*/api/exchange-rate', () =>
    HttpResponse.json({ result: 'success', conversion_rates: { KRW: 1380 } })
  ),
  http.get('*/api/domestic-gold', () => HttpResponse.json({ /* DataGoKrResponse */ })),
  http.get('*/api/market-signals/treasury', () =>
    HttpResponse.json({ observations: [{ date: '2026-03-18', value: '4.25' }] })
  ),
  http.get('*/api/market-signals/vix', () =>
    HttpResponse.json({ 'Global Quote': { '05. price': '18.50', '10. change percent': '1.25%' } })
  ),
  http.get('https://api.gold-api.com/price/XAG', () =>
    HttpResponse.json({ price: 33.5, symbol: 'XAG', updatedAt: '2026-03-25T10:00:00Z' })
  ),
]
```

### 에러 시나리오 오버라이드

```ts
// 특정 테스트에서 API 실패 주입
import { server } from '@/test/mocks/server'

it('금 API 실패 시 false 반환', async () => {
  server.use(
    http.get('*/api/gold-price', () => HttpResponse.error())
  )
  // ... 테스트
})
```

`server.use()`는 `afterEach`에서 `server.resetHandlers()`로 자동 초기화.

---

## renderWithProviders 패턴

```ts
import { renderWithProviders } from '@/test/utils/renderWithProviders'

// QueryClient 자동 포함 (retry: false, staleTime: 0)
const { getByTestId } = renderWithProviders(<MyComponent />)
```

---

## data-testid 규칙

| 컴포넌트 영역 | testid 예시 |
|-------------|-----------|
| 계산기 | `gold-calculator`, `silver-calculator`, `domestic-calculator` |
| 입력 필드 | `weight-input`, `domestic-weight-input` |
| 결과 표시 | `domestic-total-price` |
| 히스토리 | `history-section`, `domestic-history-section` |
| 차트 | `price-chart`, `domestic-price-chart`, `forecast-chart` |
| 테이블 | `price-table`, `domestic-price-table` |
| 기간 탭 | `period-tab-1W`, `period-tab-1M` 등 |
| 요약 배지 | `price-summary`, `domestic-price-summary` |
| 스켈레톤 | `calculator-skeleton`, `domestic-calculator-skeleton` |

**규칙:** 모든 테스트 가능 컴포넌트에 `data-testid` 필수.

---

## 단위 테스트 패턴 (`src/utils/`)

```ts
// src/utils/metalCalc.test.ts
import { calcPricePerGram, weightToGrams } from './metalCalc'

describe('calcPricePerGram', () => {
  it('XAU/USD 2650, 환율 1380 → 1g 원화 계산', () => {
    expect(calcPricePerGram(2650, 1380)).toBeCloseTo(117_548, 0)
  })
})
```

---

## 현재 테스트 현황 (2026-04-13)

| 파일 | 테스트 수 | 상태 |
|------|---------|------|
| `src/utils/goldCalc.test.ts` | 18 | ✅ |
| `src/utils/historyCalc.test.ts` | 18 | ✅ |
| `src/utils/format.test.ts` | 12 | ✅ |
| `src/utils/dailyCache.test.ts` | 9 | ✅ |
| `src/utils/persistentCache.test.ts` | 7 | ✅ |
| `src/utils/__tests__/fetchWithFailover.test.ts` | 6 | ✅ |
| `src/hooks/useApiAvailability.test.tsx` | 6 | ✅ |
| `src/test/functional/history.test.tsx` | 7 | ✅ |
| `src/test/functional/forecast.test.tsx` | 9 | ✅ |
| **합계** | **136** | **전체 통과** |
