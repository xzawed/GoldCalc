# Sprint 04 — 금시세 예측 (3구역)

**목표**: 이동평균·선형 회귀 기반 단기 예측 차트와 시장 신호 요약을 구현하고 면책 문구 필수 표시
**기간**: 3일
**선행 조건**: Sprint 03 완료 (히스토리 데이터 훅 재사용)
**결과물**: 과거+예측 통합 차트, 시장 신호 카드, 면책 문구가 포함된 예측 섹션
**상태**: ✅ 완료

---

## 체크리스트

### [x] 4-1. 예측 알고리즘 (`src/utils/forecast.ts`)

모든 함수는 순수 함수. 단위 테스트 28개 통과.

구현 함수:
- `calcMA(values, period)` — 단순 이동평균 (부족 구간 NaN)
- `calcLinearRegression(values)` — 선형 회귀 (slope, intercept)
- `calcStdDev(values)` — 표준편차
- `computeForecast(history, days)` — 과거 14일 실제값 + 미래 예측 + 신뢰구간
- `getTrend(history)` — MA5 vs MA20 교차 트렌드 판단

---

### [x] 4-2. 예측 데이터 훅 (`src/hooks/useForecast.ts`)

API 호출 없음. `useMemo` 기반 순수 계산.
- 입력: `HistoryEntry[]`, `ForecastDays`
- 반환: `{ forecastPoints: ForecastPoint[], trend: 'bullish' | 'bearish' | 'neutral' }`
- 데이터 부족 시 빈 배열 반환

---

### [x] 4-3. 예측 차트 (`src/components/forecast/ForecastChart.tsx`)

Recharts `ComposedChart`:
- 실제값: 실선 (`stroke="#f59e0b"`)
- 예측값: 점선 (`strokeDasharray="5 5"`)
- 신뢰구간: 반투명 Area (`fillOpacity={0.15}`)
- 오늘 날짜 기준선: `ReferenceLine`
- `role="img"`, `data-testid="forecast-chart"`

---

### [x] 4-4. 시장 신호 훅 (`src/hooks/useMarketSignals.ts`)

- FRED API: 미국 국채 10년물 (DGS10)
- Alpha Vantage: VIX 지수
- API 키 없을 경우 graceful fallback (value: 0, trend: 'neutral')
- staleTime: 24h

---

### [x] 4-5. 시장 신호 카드 (`src/components/forecast/MarketSignals.tsx`)

그리드 레이아웃. 각 신호: 이름 + 값 + 트렌드(▲▼─) + 설명.
`data-testid="market-signals"`

---

### [x] 4-6. 면책 문구 컴포넌트 (`src/components/forecast/Disclaimer.tsx`)

**제거 또는 숨김 처리 절대 금지.**
`data-testid="disclaimer"`, `role="note"`, `aria-label="투자 위험 고지"`

---

### [x] 4-7. 예측 섹션 통합 (`src/components/forecast/ForecastSection.tsx`)

- 7일/30일 탭 선택
- TrendBadge 표시 (MA5/MA20 기반)
- ForecastChart + MarketSignals
- Disclaimer 항상 렌더링 (탭 아래, 최하단)
- `data-testid="forecast-section"`

---

### [x] 4-8. 트렌드 배지 (`src/components/forecast/TrendBadge.tsx`)

- bullish → `▲ 상승세` (빨강)
- bearish → `▼ 하락세` (파랑)
- neutral → `─ 보합세` (회색)
- `data-testid="trend-badge"`, `aria-label` 포함

---

## Sprint 04 완료 기준

- [x] 7일/30일 예측 탭 전환 시 차트 업데이트
- [x] 과거 실제값(실선)과 예측값(점선) 시각적으로 명확히 구분
- [x] 신뢰 구간 반투명 영역 표시
- [x] 과거/예측 경계 수직 기준선 표시
- [x] 시장 신호 카드 표시 (API 실패 시 fallback)
- [x] 면책 문구 항상 렌더링 (숨김 처리 없음)
- [x] TypeScript 에러 0건

### 테스트 완료 기준
- [x] **UT-03** `forecast.test.ts` — 28개 테스트 통과 (커버리지 95%+)
- [x] **FT-03** `forecast.test.tsx` — 9개 테스트 통과
- [x] `data-testid="disclaimer"` 조건부 렌더링 없음 확인
