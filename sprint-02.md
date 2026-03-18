# Sprint 02 — 실시간 계산기 (1구역)

**목표**: 현재 금시세·환율을 API로 받아와 g/돈/냥 단위와 순도별 원화 가격을 즉시 계산하는 계산기 완성
**기간**: 3일
**선행 조건**: Sprint 01 완료
**결과물**: 계산기 UI가 동작하고 실시간 시세가 표시되는 상태

---

## 체크리스트

### [ ] 2-1. 금시세 환산 유틸 (`src/utils/goldCalc.ts`)

핵심 상수 및 순수 함수 구현 — 이 파일은 단위 테스트 필수.

```ts
export const TROY_OZ_TO_G = 31.1035;
export const DON_TO_G     = 3.75;
export const NYANG_TO_G   = 37.5;

export const PURITY_RATIO: Record<string, number> = {
  '24K': 0.9999,
  '18K': 0.75,
  '14K': 0.583,
};

// 단위 → 그램
export function toGrams(amount: number, unit: WeightUnit): number

// USD/oz + 환율 → 원화/g
export function calcKRWperGram(usdPerOz: number, exchangeRate: number): number

// 최종 원화 환산 (단위 + 순도 포함)
export function calcTotal(
  amount: number,
  unit: WeightUnit,
  usdPerOz: number,
  exchangeRate: number,
  purity: Purity
): number

// 단가 표시용 원화/돈
export function calcKRWperDon(usdPerOz: number, exchangeRate: number): number
```

단위 테스트 (`src/utils/goldCalc.test.ts`):
```ts
describe('금시세 환산', () => {
  test('1 troy oz = 31.1035g 변환', ...)
  test('1돈 = 3.75g 변환', ...)
  test('24K 순도 계산', ...)
  test('18K 순도 계산', ...)
  test('원화 반올림 처리', ...)
})
```

---

### [ ] 2-2. 현재 금시세 훅 (`src/hooks/useGoldPrice.ts`)

TanStack Query 사용. GoldAPI.io 호출.

```ts
export function useGoldPrice() {
  return useQuery({
    queryKey: ['goldPrice'],
    queryFn: async () => {
      const data = await apiFetch<GoldPriceResponse>(
        'https://www.goldapi.io/api/XAU/USD',
        { 'x-access-token': import.meta.env.VITE_GOLD_API_KEY }
      );
      return data;
    },
    staleTime: 5 * 60 * 1000,      // 5분 캐시
    refetchInterval: 5 * 60 * 1000, // 5분마다 자동 갱신
    refetchIntervalInBackground: false,
  });
}
```

반환값:
- `data.price` — 현재 USD/oz
- `isLoading` — 로딩 중 여부
- `isError` — 에러 여부
- `dataUpdatedAt` — 마지막 업데이트 타임스탬프

---

### [ ] 2-3. 환율 훅 (`src/hooks/useExchangeRate.ts`)

```ts
export function useExchangeRate() {
  return useQuery({
    queryKey: ['exchangeRate'],
    queryFn: async () => {
      const data = await apiFetch<ExchangeRateResponse>(
        `https://v6.exchangerate-api.com/v6/${import.meta.env.VITE_EXCHANGE_API_KEY}/latest/USD`
      );
      return data.conversion_rates.KRW as number;
    },
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });
}
```

---

### [ ] 2-4. 단위 선택 컴포넌트 (`src/components/calculator/UnitSelector.tsx`)

shadcn/ui `Tabs` 사용.

```tsx
interface Props {
  value: WeightUnit;
  onChange: (unit: WeightUnit) => void;
}

// g | 돈 | 냥 탭 렌더링
// 탭 변경 시 부모에 onChange 전달
```

---

### [ ] 2-5. 순도 선택 컴포넌트 (`src/components/calculator/PuritySelector.tsx`)

shadcn/ui `Select` 또는 버튼 그룹 사용.

```tsx
interface Props {
  value: Purity;
  onChange: (purity: Purity) => void;
}

// 24K (99.99%) | 18K (75%) | 14K (58.3%)
// 선택된 항목 강조 표시
```

---

### [ ] 2-6. 가격 표시 컴포넌트 (`src/components/calculator/PriceDisplay.tsx`)

```tsx
interface Props {
  totalKRW: number;         // 최종 원화 총액
  krwPerGram: number;       // 원화/g 단가
  krwPerDon: number;        // 원화/돈 단가
  amount: number;
  unit: WeightUnit;
  purity: Purity;
}

// 표시 예:
// ━━━━━━━━━━━━━━━━━
// 10돈 × 24K
// 37,500,000원
// ━━━━━━━━━━━━━━━━━
// 단가  원/g  1,000,000원
//       원/돈 3,750,000원
```

로딩 중: shadcn/ui `Skeleton` 표시
에러 시: `─` 또는 "시세를 불러올 수 없습니다" 표시

---

### [ ] 2-7. 메인 계산기 통합 (`src/components/calculator/GoldCalculator.tsx`)

상태:
```ts
const [amount, setAmount] = useState<number>(1);
const [unit, setUnit] = useState<WeightUnit>('don');
const [purity, setPurity] = useState<Purity>('24K');
```

로직:
```ts
const { data: goldData, isLoading: goldLoading } = useGoldPrice();
const { data: exchangeRate, isLoading: rateLoading } = useExchangeRate();

const totalKRW = useMemo(() => {
  if (!goldData || !exchangeRate) return null;
  return calcTotal(amount, unit, goldData.price, exchangeRate, purity);
}, [amount, unit, purity, goldData, exchangeRate]);
```

마지막 업데이트 시각 표시:
```ts
format(new Date(goldData.timestamp * 1000), 'yyyy-MM-dd HH:mm', { locale: ko }) + ' 기준'
```

---

### [ ] 2-8. 시세 헤더 바 (`src/components/layout/PriceBar.tsx`)

Header 아래에 현재 시세 요약을 항상 표시.

```
현재 금시세  $2,650.00 / oz    환율  1,320원 / USD    원화/g  112,340원
                                                    2026-03-18 14:32 기준
```

로딩 중에는 Skeleton 처리.

---

### [ ] 2-9. App.tsx에 계산기 구역 연결

```tsx
import { GoldCalculator } from './components/calculator/GoldCalculator';

<section id="calculator">
  <GoldCalculator />
</section>
```

---

## Sprint 02 완료 기준

- [ ] 금 무게 입력 시 원화 즉시 계산 동작
- [ ] g / 돈 / 냥 탭 전환 시 결과 재계산
- [ ] 24K / 18K / 14K 선택 시 결과 재계산
- [ ] 5분마다 시세 자동 갱신 (브라우저 네트워크 탭에서 확인)
- [ ] API 로딩 중 Skeleton 표시
- [ ] API 에러 시 에러 Alert 표시
- [ ] TypeScript 에러 0건

### 테스트 완료 기준 (testing.md 참고)
- [ ] **UT-01** `goldCalc.test.ts` — 환산 공식 전체 케이스 통과 (커버리지 100%)
- [ ] **IT-01** `useGoldPrice.test.ts` — 정상/에러/캐시 동작 통과
- [ ] **IT-02 일부** `useExchangeRate.test.ts` — 정상/에러 동작 통과
- [ ] **IT-04** `GoldCalculator.test.tsx` — 렌더링·상호작용·에러 통과
- [ ] **FT-01** `calculator.test.tsx` — A~D 시나리오 전부 통과
- [ ] `data-testid` 속성 추가: `total-price`, `unit-price-gram`, `unit-price-don`, `price-skeleton`
