# Sprint 02 — 실시간 계산기 (1구역)

**목표**: 현재 금시세·환율을 API로 받아와 g/돈/냥 단위와 순도별 원화 가격을 즉시 계산하는 계산기 완성
**기간**: 3일
**선행 조건**: Sprint 01 완료
**결과물**: 계산기 UI가 동작하고 실시간 시세가 표시되는 상태
**상태**: ✅ 완료

---

## 체크리스트

### [x] 2-1. 금시세 환산 유틸 (`src/utils/goldCalc.ts`)

핵심 상수 및 순수 함수 구현 — 단위 테스트 18개 통과 (100% 커버리지).

구현 함수:
- `TROY_OZ_TO_G`, `DON_TO_G`, `NYANG_TO_G`, `PURITY_RATIO` 상수
- `calcPricePerGram(priceUSD, exchangeRate)` → 원화/g
- `weightToGrams(weight, unit)` → 그램 변환
- `calcGoldPrice(weight, unit, purity, priceUSD, exchangeRate)` → 원화 총액

---

### [x] 2-2. 현재 금시세 훅 (`src/hooks/useGoldPrice.ts`)

TanStack Query 사용. GoldAPI.io 호출.
- URL: `${VITE_GOLD_API_URL}/XAU/USD`
- Header: `x-access-token: ${VITE_GOLD_API_KEY}`
- 반환: `{ priceUSD, changePercent, updatedAt }`
- staleTime: 60s, refetchInterval: 5min

---

### [x] 2-3. 환율 훅 (`src/hooks/useExchangeRate.ts`)

- URL: `${VITE_EXCHANGE_RATE_API_URL}/${VITE_EXCHANGE_RATE_API_KEY}/latest/USD`
- 반환: `{ exchangeRate: number }`
- staleTime: 60s, refetchInterval: 5min

---

### [x] 2-4. 단위 선택 컴포넌트 (`src/components/calculator/UnitSelector.tsx`)

shadcn/ui `Tabs` 사용. g / 돈 / 냥 탭. `data-testid="unit-tab-{unit}"`.

---

### [x] 2-5. 순도 선택 컴포넌트 (`src/components/calculator/PuritySelector.tsx`)

shadcn/ui `Select` 사용. 24K / 18K / 14K. `data-testid="purity-selector"`.

---

### [x] 2-6. 가격 표시 컴포넌트 (`src/components/calculator/PriceDisplay.tsx`)

- 총 원화 금액 (대형 폰트)
- 전일 대비 등락 (색상 + 아이콘 + aria-label)
- 1g 단가 / 1돈 단가 비교 표시
- `data-testid="price-display"`, `"total-price"`, `"price-per-gram"`, `"price-per-don"`

---

### [x] 2-7. 메인 계산기 통합 (`src/components/calculator/GoldCalculator.tsx`)

- useState: weight (number), unit (WeightUnit), purity (Purity)
- useGoldPrice + useExchangeRate 훅 조합
- 로딩 Skeleton, 에러 Alert 처리
- `data-testid="gold-calculator"`

---

### [x] 2-8. 시세 헤더 바 (`src/components/layout/PriceBar.tsx`)

useGoldPrice + useExchangeRate 훅으로 재구성.
calcPricePerGram()으로 원화/g 계산.
`data-testid="price-bar"`, `"price-krw"`, `"price-usd"`, `"price-change"`

---

### [x] 2-9. App.tsx에 계산기 구역 연결 (기존 완료)

CalculatorSection → GoldCalculator lazy import 완료.

---

## Sprint 02 완료 기준

- [x] 금 무게 입력 시 원화 즉시 계산 동작
- [x] g / 돈 / 냥 탭 전환 시 결과 재계산
- [x] 24K / 18K / 14K 선택 시 결과 재계산
- [x] 5분마다 시세 자동 갱신
- [x] API 로딩 중 Skeleton 표시
- [x] API 에러 시 에러 Alert 표시
- [x] TypeScript 에러 0건

### 테스트 완료 기준
- [x] **UT-01** `goldCalc.test.ts` — 18개 테스트 통과 (커버리지 100%)
- [x] **IT-04** `GoldCalculator.test.tsx` — functional/calculator.test.tsx 10개 통과
- [x] **FT-01** `calculator.test.tsx` — 전부 통과
