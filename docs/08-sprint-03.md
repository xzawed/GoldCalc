# Sprint 03 — 날짜별 시세 변동 내역 (2구역)

**목표**: 기간별 금시세 히스토리를 차트·테이블로 시각화하고 최고/최저/평균 요약 제공
**기간**: 3일
**선행 조건**: Sprint 02 완료 (환율 훅, API 패턴 재사용)
**결과물**: 기간 탭 전환 시 차트·테이블이 업데이트되는 히스토리 섹션
**상태**: ✅ 완료

---

## 체크리스트

### [x] 3-1. 히스토리 데이터 fetch 훅 (`src/hooks/useGoldHistory.ts`)

GoldAPI.io 날짜별 엔드포인트 병렬 호출. 기간별 샘플링:
- 1W: 매일 (7포인트)
- 1M: 매일 (30포인트)
- 3M: 3일 간격 (~30포인트)
- 1Y: 7일 간격 (~52포인트)

staleTime: 24h (API rate limit 보호). queryKey: `['goldHistory', period]`.

> **주의**: GoldAPI.io 무료 플랜 월 100회 제한. 24시간 캐시 필수.

---

### [x] 3-2. 히스토리 데이터 변환 함수 (`src/utils/historyCalc.ts`)

- `calcChangeRate(current, previous)` → 등락률 %
- `calcPeriodSummary(entries)` → { highest, lowest, averageKRW }
- `addChangeRates(entries)` → 전일 대비 등락률 추가

단위 테스트 18개 통과.

---

### [x] 3-3. 요약 배지 컴포넌트 (`src/components/history/PriceSummary.tsx`)

최고가(빨강 배지)/최저가(파랑 배지)/평균가(회색 배지) + 날짜 표시.
`data-testid="price-summary"`, `"summary-highest"`, `"summary-lowest"`, `"summary-average"`

---

### [x] 3-4. 시세 변동 차트 (`src/components/history/PriceChart.tsx`)

Recharts `ComposedChart` + 이중 Y축:
- 좌측 Y축: USD/oz (금색 `#f59e0b`)
- 우측 Y축: 원화/g (에메랄드 `#10b981`)
- `role="img"`, `data-testid="price-chart"`

---

### [x] 3-5. 날짜별 시세 테이블 (`src/components/history/PriceTable.tsx`)

- 컬럼: 날짜 | 국제금시세(USD/oz) | 원화/g | 전일대비
- 최신 날짜 상단 (내림차순)
- 등락 표시: ▲ 빨강 / ▼ 파랑 + aria-label
- `data-testid="price-table"`

---

### [x] 3-6. 히스토리 섹션 통합 (`src/components/history/HistorySection.tsx`)

기간 탭 (1주/1개월/3개월/1년) + 차트 + 요약 배지 + 테이블 통합.
`data-testid="history-section"`, 기간 탭: `"period-tab-{period}"`

---

### [x] 3-7. 로딩 스켈레톤 (`src/components/history/ChartSkeleton.tsx`)

차트 영역(h-64) + 배지 3개 + 테이블 행 Skeleton.
`data-testid="chart-skeleton"`

---

## Sprint 03 완료 기준

- [x] 4가지 기간 탭(1주/1개월/3개월/1년) 전환 시 차트·테이블 업데이트
- [x] 이중 Y축 차트 정상 렌더링 (USD/oz + 원화/g)
- [x] 최고가/최저가/평균가 배지 정확한 값 표시
- [x] 테이블 등락 색상 올바른 적용 (상승 빨강, 하락 파랑)
- [x] 기간 탭 재선택 시 캐시 활용 (24h staleTime)
- [x] 로딩 중 Skeleton, 에러 시 Alert 표시
- [x] TypeScript 에러 0건

### 테스트 완료 기준
- [x] **UT-02** `historyCalc.test.ts` — 18개 테스트 통과
- [x] **FT-02** `history.test.tsx` — 7개 테스트 통과
