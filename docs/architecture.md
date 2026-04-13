# Architecture — 시스템 구조

> 현재 구현 상태(as-is). 컴포넌트 추가·수정 시 이 파일 업데이트.

---

## 4구역 레이아웃

```
┌─────────────────────────────────────────┐
│  Header + PriceBar                       │ ← layout/
│  [국제 금] [국제 은] [국내 금] [국내 은]  │ ← AssetNav (탭)
├─────────────────────────────────────────┤
│  [1구역] 계산기                           │ ← calculator/ 또는 domestic/
│  실시간 시세 + 단위/순도 선택 + 원화 환산  │
├─────────────────────────────────────────┤
│  [2구역] 시세 변동 내역                   │ ← history/ 또는 domestic/
│  기간 탭: 1W | 1M | 3M | 1Y             │
│  요약 배지 + 라인 차트 + 날짜별 테이블    │
├─────────────────────────────────────────┤
│  [3구역] 시세 예측 (국제 금/은만)          │ ← forecast/
│  과거(실선) + 예측(점선) + 신뢰구간       │
│  시장 신호 카드 + 면책 문구 (항상 표시)   │
├─────────────────────────────────────────┤
│  [4구역] 금융 소식 (모든 탭 공통)          │ ← news/
│  useFinancialNews → NewsCard 리스트      │
└─────────────────────────────────────────┘
```

---

## 자산 탭별 렌더링 분기

| 탭 키 | 1구역 | 2구역 | 3구역 |
|-------|------|------|------|
| `intl-gold` | `MetalCalculator metal="gold"` | `HistorySection metal="gold"` | `ForecastSection metal="gold"` |
| `intl-silver` | `MetalCalculator metal="silver"` | `HistorySection metal="silver"` | `ForecastSection metal="silver"` |
| `domestic-gold` | `DomesticGoldSection` (내장) | `DomesticGoldSection` (내장) | 없음 |
| `domestic-silver` | `DomesticSilverSection` (내장) | `DomesticSilverSection` (내장) | 없음 |

**탭 자동 숨김:** `useApiAvailability` → 데이터 없는 탭 비활성화  
**소스:** `src/App.tsx`, `src/components/layout/AssetNav.tsx`

---

## 컴포넌트 파일 맵

```
src/components/
├── layout/
│   ├── Header.tsx           — 앱 헤더
│   ├── AssetNav.tsx         — 자산 탭 네비게이션
│   ├── PriceBar.tsx         — 현재 시세 요약 바
│   ├── OfflineBanner.tsx    — 오프라인 감지 배너
│   └── Footer.tsx
├── common/
│   └── ErrorAlert.tsx       — 공통 에러 Alert (재시도 버튼 포함)
├── calculator/
│   ├── CalculatorSection.tsx
│   ├── MetalCalculator.tsx  — 국제 금/은 공통 계산기
│   ├── UnitSelector.tsx     — g/돈/냥 단위 선택
│   ├── PuritySelector.tsx   — 순도 선택
│   └── PriceDisplay.tsx     — 원화 환산 결과 표시
├── history/
│   ├── HistorySection.tsx   — 기간 탭 + 데이터 로딩
│   ├── PriceChart.tsx       — Recharts 이중 Y축 차트
│   ├── PriceTable.tsx       — 날짜별 시세 테이블
│   ├── PriceSummary.tsx     — 최고/최저/평균 배지
│   └── ChartSkeleton.tsx
├── domestic/
│   ├── DomesticGoldSection.tsx   — 국내금 전체 섹션 (계산기+히스토리 포함)
│   └── DomesticSilverSection.tsx — 국내은 전체 섹션
├── forecast/
│   ├── ForecastSection.tsx
│   ├── ForecastChart.tsx    — 과거+예측 통합 차트
│   ├── MarketSignals.tsx    — DXY/국채/VIX 카드
│   ├── TrendBadge.tsx
│   └── Disclaimer.tsx       — 면책 문구 (항상 렌더링, 조건부 금지)
└── news/
    └── NewsSection.tsx      — useFinancialNews(구글 뉴스 RSS) 기반 NewsCard 리스트
```

---

## 데이터 흐름

```
외부 API
  │
  ▼ (server.js 프록시 경유)
/api/gold-price          → useGoldPrice      → MetalCalculator, PriceBar
/api/gold-history        → useGoldHistory    → HistorySection
/api/exchange-rate       → useExchangeRate   → MetalCalculator, HistorySection, PriceBar
/api/market-signals/*    → useMarketSignals  → MarketSignals
/api/domestic-gold       → useDomesticGoldPrice, useDomesticGoldHistory → DomesticGoldSection
/api/news (Google RSS)   → useFinancialNews  → NewsSection

gold-api.com (직접)      → useSilverPrice    → MetalCalculator (silver)
gold-api.com (직접)      → useSilverHistory  → HistorySection (silver)

TanStack Query (캐시)
  │
  ▼
컴포넌트 렌더링
```

---

## 페일오버 아키텍처 (국내금 전용)

```
useDomesticGoldPrice / useDomesticGoldHistory
  │
  ▼
fetchWithFailover() [src/utils/fetchWithFailover.ts]
  │
  ├─ [정상] Railway /api/domestic-gold
  │
  ├─ [Railway 5초 타임아웃] → Supabase Edge Function (VITE_SUPABASE_URL)
  │   https://ghlutgsnlceowdttxasp.supabase.co/functions/v1/domestic-gold
  │
  └─ [양쪽 실패] → 에러 throw → TanStack Query 에러 상태 → ErrorAlert 표시
```

**Circuit Breaker:** Railway 실패 후 60초간 Supabase 우선 사용  
**VITE_SUPABASE_URL 미설정 시:** 페일오버 비활성, Railway 직접 사용

---

## 핵심 유틸리티

| 파일 | 역할 |
|------|------|
| `src/utils/metalCalc.ts` | 모든 금/은 계산 순수 함수 (컴포넌트 직접 계산 금지) |
| `src/utils/forecast.ts` | MA5/MA20 이동평균, 선형 회귀 예측 알고리즘 |
| `src/utils/dailyCache.ts` | localStorage 당일 캐시 (API 무료 한도 보호) |
| `src/utils/persistentCache.ts` | 마지막 수신 데이터 영속 보관 (만료 없음) |
| `src/utils/fetchWithFailover.ts` | Railway→Supabase Circuit Breaker |
| `src/utils/format.ts` | KRW 표시, 날짜 포맷, 등락률 포맷 |
| `src/constants/api.ts` | `GOLD_API_COM_URL` 등 API URL 상수 |
| `src/constants/newsDefaults.ts` | `DEFAULT_NEWS_PUBLIC_URL` — 구글 뉴스 "금 시세" 검색 링크 |
| `src/types/gold.ts` | 공유 타입: Metal, Period, GoldPurity, PERIOD_OPTIONS 등 |
