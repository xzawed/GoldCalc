# GoldCalc — 귀금속 시세 계산기

국제 금·은 시세(USD/troy oz)와 국내 금시세(KRX)를 실시간으로 조회하여,
g/돈/냥 단위로 원화 가격을 즉시 계산해주는 웹 앱입니다.

[![CI](https://github.com/xzawed/GoldCalc/actions/workflows/ci.yml/badge.svg)](https://github.com/xzawed/GoldCalc/actions/workflows/ci.yml)
[![Vercel](https://img.shields.io/badge/Vercel-배포중-black?logo=vercel)](https://goldcalc-mu.vercel.app)

**🚀 프로덕션**: https://goldcalc-mu.vercel.app

---

## 현재 구현 상태

Sprint 01~05 전체 완료. Sprint 06 진행 중: 은시세 계산·히스토리, 국내 금시세 계산·히스토리 확장. Vercel 자동 배포 운영 중.

- **1구역 계산기**: 실시간 금·은 시세·환율 fetch, g/돈/냥 단위 입력, 금 24K/18K/14K · 은 999/925/900/800 순도 선택, 원화 즉시 환산
- **2구역 시세 변동**: 1주/1개월/3개월/1년 히스토리 차트(이중 Y축), 날짜별 등락 테이블, 최고·최저·평균 배지 (국제금·국제은·국내금 지원)
- **3구역 예측**: MA5/MA20 + 선형 회귀 기반 7일/30일 예측 차트, 신뢰 구간, 시장 신호(DXY · 국채 · VIX), 면책 문구 상시 표시
- **자산 탭 네비게이션**: 국제금 / 국제은 / 국내금 전환

---

## 무료 플랜 & 과금 방지 정책

본 프로젝트는 외부 API를 **무료 플랜 기준**으로만 사용하고,
요청 주기/캐싱(`staleTime` / `refetchInterval`)을 적용해 **추가 과금 없이 운영**하는 것을 목표로 합니다.

---

## 진행 현황

### 전체 Sprint 로드맵

```
Sprint 01  ████████████████████  완료  프로젝트 기반 구축
Sprint 02  ████████████████████  완료  실시간 금시세 계산기
Sprint 03  ████████████████████  완료  시세 변동 차트 & 테이블
Sprint 04  ████████████████████  완료  가격 예측 & 시장 신호
Sprint 05  ████████████████████  완료  품질 완성 & Vercel 자동 배포
Sprint 06  ████████████████████  진행중  은시세 + 국내금시세 확장
```

---

### ✅ Sprint 01 — 프로젝트 기반 구축 (완료)

**브랜치**: `feature/sprint-01-setup` → `main` 병합 완료

| 항목 | 상태 |
|------|------|
| Vite + React 18 + TypeScript 5 프로젝트 구성 | ✅ |
| Tailwind CSS v3 + shadcn/ui 컴포넌트 세팅 | ✅ |
| TanStack Query v5 QueryClientProvider | ✅ |
| 공통 타입 정의 (`types/gold.ts`) | ✅ |
| 공통 유틸 (`format.ts`, `api.ts`, `lib/utils.ts`) | ✅ |
| 레이아웃 컴포넌트 (Header, PriceBar, Footer, OfflineBanner) | ✅ |
| MSW v2 테스트 인프라 (server, handlers, fixtures) | ✅ |
| format.ts 단위 테스트 12개 전체 통과 | ✅ |
| GitHub Actions CI 워크플로우 (ci.yml) | ✅ |

---

### ✅ Sprint 02 — 실시간 금시세 계산기 (완료)

| 항목 | 상태 |
|------|------|
| `src/utils/goldCalc.ts` — 단위 변환·순도 환산 순수 함수 | ✅ |
| `src/hooks/useGoldPrice.ts` — 현재 금시세 fetch (5분 자동 갱신) | ✅ |
| `src/hooks/useExchangeRate.ts` — 환율 fetch | ✅ |
| `src/components/calculator/UnitSelector.tsx` — g / 돈 / 냥 탭 | ✅ |
| `src/components/calculator/PuritySelector.tsx` — 24K / 18K / 14K | ✅ |
| `src/components/calculator/PriceDisplay.tsx` — 원화 환산 결과 (aria-live) | ✅ |
| `src/components/calculator/GoldCalculator.tsx` — 계산기 통합 컴포넌트 | ✅ |
| goldCalc.test.ts — 단위 테스트 18개 통과 (100% 커버리지) | ✅ |
| calculator.test.tsx — 기능 테스트 10개 통과 | ✅ |

---

### ✅ Sprint 03 — 시세 변동 차트 & 테이블 (완료)

| 항목 | 상태 |
|------|------|
| `src/utils/historyCalc.ts` — 등락률·최고/최저/평균 계산 | ✅ |
| `src/hooks/useGoldHistory.ts` — 기간별 히스토리 fetch (1W/1M/3M/1Y) | ✅ |
| `src/components/history/PriceChart.tsx` — Recharts 이중 Y축 차트 (USD/oz + 원화/g) | ✅ |
| `src/components/history/PriceTable.tsx` — 날짜별 등락 테이블 (상승 빨강▲ / 하락 파랑▼) | ✅ |
| `src/components/history/PriceSummary.tsx` — 최고가·최저가·평균가 배지 | ✅ |
| `src/components/history/ChartSkeleton.tsx` — 로딩 스켈레톤 | ✅ |
| historyCalc.test.ts — 단위 테스트 18개 통과 | ✅ |
| history.test.tsx — 기능 테스트 7개 통과 | ✅ |

---

### ✅ Sprint 04 — 가격 예측 & 시장 신호 (완료)

| 항목 | 상태 |
|------|------|
| `src/utils/forecast.ts` — MA5/MA20 이동평균 + 선형 회귀 + ±1σ 신뢰 구간 | ✅ |
| `src/hooks/useForecast.ts` — 예측 데이터 계산 (useMemo 기반) | ✅ |
| `src/hooks/useMarketSignals.ts` — DXY / 국채 10년물 / VIX 지수 fetch | ✅ |
| `src/components/forecast/ForecastChart.tsx` — 과거(실선) + 예측(점선) + 신뢰 구간(반투명 영역) | ✅ |
| `src/components/forecast/MarketSignals.tsx` — 시장 신호 카드 | ✅ |
| `src/components/forecast/Disclaimer.tsx` — **면책 문구 (항상 렌더링, 조건부 금지)** | ✅ |
| forecast.test.ts — 단위 테스트 28개 통과 | ✅ |
| forecast.test.tsx — 기능 테스트 9개 통과 | ✅ |

---

### ✅ Sprint 05 — 품질 완성 (코드 완료)

| 항목 | 상태 |
|------|------|
| 반응형 레이아웃 (flex-wrap, overflow-x-auto, sm:grid-cols-2) | ✅ |
| 에러 시나리오 처리 6종 (API 실패, 오프라인, 빈 데이터 등) | ✅ |
| 접근성 강화 (aria-label, role="img", aria-live="polite") | ✅ |
| React.memo (MarketSignals, PriceTable) + useMemo 메모이제이션 | ✅ |
| lazy() + Suspense 코드 스플리팅 (3개 섹션) | ✅ |
| 초기 JS 번들 213kB (목표 500kB 이하) | ✅ |
| 전체 102개 테스트 통과 | ✅ |
| GitHub Actions CI 통과 | ✅ |
| Vercel 프로덕션 배포 | ✅ https://goldcalc-mu.vercel.app |

---

### Sprint 06 — 은시세 + 국내금시세 확장 (진행중)

| 항목 | 상태 |
|------|------|
| 타입 시스템 확장 (Metal, SilverPurity, AssetTab) | ✅ |
| 계산 유틸 일반화 (metalCalc.ts) | ✅ |
| 자산 탭 네비게이션 (국제금/국제은/국내금) | ✅ |
| 은시세 API 훅 (gold-api.com, 무료) | ✅ |
| 국내 금시세 Vercel 프록시 + 훅 (data.go.kr) | ✅ |
| 국내금 히스토리 차트·테이블·요약 배지 | ✅ |
| 컴포넌트 일반화 (metal prop) | ✅ |
| Header/PriceBar/Footer 자산별 대응 | ✅ |

---

## 주요 기능

| 구역 | 기능 |
|------|------|
| **1구역 — 계산기** | 실시간 금시세 + 환율 조회, g/돈/냥 단위 입력, 24K/18K/14K 순도 선택, 원화 즉시 환산 |
| **2구역 — 시세 변동** | 1주/1개월/3개월/1년 히스토리 차트 (이중 Y축), 날짜별 등락 테이블, 최고·최저·평균 배지 |
| **3구역 — 예측** | MA5/MA20 + 선형 회귀 기반 7일/30일 예측 차트, 신뢰 구간, 시장 신호 (DXY · 국채 · VIX) |
| **국제 은시세** | 실시간 은시세 조회, 은 순도(999/925/900/800) 선택, 히스토리 차트·테이블 |
| **국내 금시세** | KRX 국내 금시세 조회 (data.go.kr), 국내금 히스토리 차트·테이블·요약 배지 |

---

## 기술 스택

| 역할 | 기술 |
|------|------|
| UI 프레임워크 | React 18 |
| 언어 | TypeScript 5 |
| 빌드 | Vite 6 |
| 스타일링 | Tailwind CSS v3 + shadcn/ui |
| API 캐싱 | TanStack Query v5 |
| 차트 | Recharts v2 |
| 테스트 | Vitest v2 + React Testing Library + MSW v2 |
| 배포 | Vercel (GitHub 연동 자동 배포) |

---

## 도메인 지식

### 무게 단위 변환

| 단위 | 기준 |
|------|------|
| 1 트로이 온스 (troy oz) | 31.1035 g |
| 1 돈 | 3.75 g |
| 1 냥 | 37.5 g (= 10돈) |

### 환산 공식

```
금 1g 원화 가격 = (국제 금시세 USD/oz ÷ 31.1035) × USD/KRW 환율
금 1돈 원화 가격 = 금 1g 원화 가격 × 3.75
```

### 순도 계수

| 순도 | 계수 |
|------|------|
| 24K | 0.9999 |
| 18K | 0.75 |
| 14K | 0.583 |

### 은 순도 계수

| 순도 | 계수 |
|------|------|
| 999 | 0.999 |
| 925 | 0.925 |
| 900 | 0.9 |
| 800 | 0.8 |

---

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경변수 설정

> ⚠️ **보안 주의**: `.env` 파일에 실제 API 키를 입력하세요. `.env` 파일은 `.gitignore`에 의해 Git에서 **자동으로 제외**되므로 절대 커밋되지 않습니다.
> `.env.example`에는 키 이름만 있고 값은 비어 있습니다 — 이 상태 그대로 유지해야 합니다.

```bash
cp .env.example .env   # .env 파일 생성
```

`.env` 파일에 발급받은 API 키를 입력합니다:

```env
VITE_GOLD_API_KEY=여기에_실제_키_입력
VITE_GOLD_API_URL=https://www.goldapi.io/api

VITE_EXCHANGE_RATE_API_KEY=여기에_실제_키_입력
VITE_EXCHANGE_RATE_API_URL=https://v6.exchangerate-api.com/v6

VITE_ALPHA_VANTAGE_KEY=   # (선택) 시장 신호용
VITE_FRED_API_KEY=         # (선택) 국채 금리용

# Vercel 서버사이드 전용 (VITE_ 접두사 없음)
DATA_GO_KR_API_KEY=여기에_실제_키_입력   # 국내 금시세 (data.go.kr)
```

> **API 키 발급** (모두 무료 플랜 사용)
> - 금시세: [GoldAPI.io](https://www.goldapi.io/)
> - 환율: [ExchangeRate-API](https://www.exchangerate-api.com/)
> - 시장 신호(선택): [Alpha Vantage](https://www.alphavantage.co/), [FRED](https://fred.stlouisfed.org/)
> - 국내 금시세: [공공데이터포털 data.go.kr](https://www.data.go.kr/) — Vercel 서버사이드 프록시 전용

### 3. 개발 서버 실행

```bash
npm run dev        # localhost:5173
```

---

## 스크립트

```bash
npm run dev            # 개발 서버
npm run build          # 프로덕션 빌드
npm run preview        # 빌드 결과 미리보기
npm run lint           # ESLint 검사
npm run type-check     # TypeScript 타입 검사
npm run test           # 전체 테스트
npm run test:coverage  # 커버리지 포함 테스트
```

---

## 프로젝트 구조

```
GoldCalc/
├── .github/
│   ├── workflows/ci.yml          # CI: lint → type-check → test → build
│   └── pull_request_template.md
├── api/                           # Vercel Serverless Functions (국내 금시세 프록시)
├── src/
│   ├── components/
│   │   ├── layout/               # Header, PriceBar, Footer, OfflineBanner, AssetNav
│   │   ├── common/               # ErrorAlert
│   │   ├── calculator/           # 1구역 계산기 (GoldCalculator, MetalCalculator, UnitSelector, PuritySelector, PriceDisplay)
│   │   ├── history/              # 2구역 시세 변동 (PriceChart, PriceTable, PriceSummary, ChartSkeleton)
│   │   ├── forecast/             # 3구역 예측 (ForecastChart, MarketSignals, TrendBadge, Disclaimer)
│   │   └── domestic/             # 국내 금시세 (DomesticGoldSection)
│   ├── hooks/                    # TanStack Query 기반 데이터 훅 (useGoldPrice, useExchangeRate, useGoldHistory, useForecast, useMarketSignals, useOnlineStatus, useSilverPrice, useSilverHistory, useDomesticGoldPrice, useDomesticGoldHistory)
│   ├── utils/                    # 순수 함수 (goldCalc, metalCalc, historyCalc, forecast, format, api)
│   ├── types/gold.ts             # 공유 TypeScript 타입 (Metal, SilverPurity, AssetTab 포함)
│   └── test/                     # MSW 서버·핸들러·픽스처·커스텀 렌더 + 기능 테스트
├── .env                          # 실제 API 키 — Git 제외 (절대 커밋 금지)
├── .env.example                  # 키 이름 템플릿만 — 값 없이 커밋
├── vercel.json                   # SPA 라우팅 rewrite 설정
└── CLAUDE.md                     # AI 개발 가이드 (개발 규칙 전체)
```

---

## 개발 규칙 요약

- **API 호출**: TanStack Query `useQuery`로만 처리 — 컴포넌트 직접 fetch 금지
- **계산 로직**: `utils/goldCalc.ts` 순수 함수로 분리 — 컴포넌트 직접 작성 금지
- **등락 색상**: 한국 증시 관례 — 상승 `#ef4444` 빨강▲, 하락 `#3b82f6` 파랑▼
- **면책 문구**: `Disclaimer` 컴포넌트는 항상 렌더링 — 조건부/숨김 처리 절대 금지
- **원화 표시**: `₩146,500` 형식 (`formatKRW` 함수 사용, ₩ 접두사 + 천 단위 콤마)

---

## CI/CD

- **CI**: GitHub Actions — `feature/**` push 및 `main` PR 시 자동 실행
  - lint → type-check → test:coverage
- **배포**: GitHub Actions → Vercel CLI 자동 배포
  - `main` 푸시 → 프로덕션 자동 배포 → https://goldcalc-mu.vercel.app
  - PR 생성 → Preview URL 자동 생성

---

## 테스트 현황

| 파일 | 테스트 수 | 종류 |
|------|-----------|------|
| `src/utils/format.test.ts` | 12 | 단위 테스트 |
| `src/utils/goldCalc.test.ts` | 18 | 단위 테스트 (100% 커버리지) |
| `src/utils/historyCalc.test.ts` | 18 | 단위 테스트 |
| `src/utils/forecast.test.ts` | 28 | 단위 테스트 |
| `src/test/functional/calculator.test.tsx` | 10 | 기능 테스트 |
| `src/test/functional/history.test.tsx` | 7 | 기능 테스트 |
| `src/test/functional/forecast.test.tsx` | 9 | 기능 테스트 |
| **합계** | **102** | **전체 통과** |

---

## 관련 문서

| 문서 | 내용 |
|------|------|
| `CLAUDE.md` | 프로젝트 전체 개요 및 개발 규칙 |
| `docs/01-prd.md` | 제품 요구사항 명세 |
| `docs/02-techstack.md` | 기술 스택 선정 근거 |
| `docs/03-skills.md` | 구현 패턴 및 코드 예시 |
| `docs/04-testing.md` | 테스트 전략 및 케이스 명세 |
| `docs/05-cicd.md` | CI/CD 파이프라인 설정 가이드 |
| `docs/06-sprint-01.md` | Sprint 01 체크리스트 (완료) |
| `docs/07-sprint-02.md` | Sprint 02 체크리스트 (완료) |
| `docs/08-sprint-03.md` | Sprint 03 체크리스트 (완료) |
| `docs/09-sprint-04.md` | Sprint 04 체크리스트 (완료) |
| `docs/10-sprint-05.md` | Sprint 05 체크리스트 (완료) |
| `docs/11-decisions.md` | 아키텍처 결정 기록 (ADR) |
| `docs/12-api-key-guide.md` | API 키 발급 및 설정 가이드 |

---

## 라이선스

MIT
