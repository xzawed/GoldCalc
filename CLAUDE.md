# GoldCalc - 귀금속 시세 계산기

## 프로젝트 개요

국제 금시세·은시세(USD/troy oz) 및 국내 금시세(KRX)를 실시간 환율로 원화(KRW)로 환산하여,
사용자가 g(그램) 또는 돈 단위로 귀금속의 무게를 입력하면 현재 원화 가격을 보여주는 웹 앱.

## 기술 스택

| 역할 | 기술 | 버전 |
|------|------|------|
| UI 프레임워크 | React | 18 |
| 언어 | TypeScript | 5 |
| 빌드 도구 | Vite | 5 |
| 스타일링 | Tailwind CSS | 3 |
| UI 컴포넌트 | shadcn/ui | CLI 설치 |
| API 캐싱 | TanStack Query | 5 |
| 차트 | Recharts | 2 |
| 날짜 처리 | date-fns | 3 |
| 테스트 | Vitest + React Testing Library + MSW | - |
| 배포 | Railway | - |
| CI/CD | GitHub Actions | - |

## 도메인 지식 (필수)

### 무게 단위 변환

| 단위 | 기준 |
|------|------|
| 1 트로이 온스 (troy oz) | 31.1035 g |
| 1 돈 | 3.75 g |
| 1 냥 | 37.5 g (= 10돈) |
| 1 관 | 3,750 g (= 1000돈) |

### 은 순도

| 순도 | 함량 |
|------|------|
| 999 | 순은 99.9% |
| 925 | 스털링 실버 92.5% |
| 900 | 90% |
| 800 | 80% |

### 환산 공식

```
금 1g 원화 가격 = (국제 금시세 USD/oz ÷ 31.1035) × USD/KRW 환율
금 1돈 원화 가격 = 금 1g 원화 가격 × 3.75
은 1g 원화 가격 = (국제 은시세 USD/oz ÷ 31.1035) × USD/KRW 환율
```

### 주요 개념

- **국제 금시세**: 런던 금시장 기준 USD/troy oz (LBMA Gold Price)
- **국제 은시세**: USD/troy oz (XAG)
- **국내 금시세**: KRX 금시장 기준가 (원/g)
- **환율**: USD/KRW 실시간 환율
- **순도**: 24K(순금 99.99%), 18K(75%), 14K(58.3%) — 선택 옵션으로 제공
- **거래 종류**: 살 때(매도가), 팔 때(매입가) 구분 — 스프레드 차이 존재

## 주요 기능

### 자산 탭 네비게이션
- **[국제 금] [국제 은] [국내 금] [국내 은]** 탭으로 자산 전환
- 선택된 탭에 따라 아래 1~3구역이 해당 자산 데이터로 렌더링
- 국내 금·국내 은은 3구역(예측) 미제공
- 국내 은시세는 국제 XAG/USD를 실시간 USD/KRW 환율로 환산 (KRX 은 현물 시장 없음)

### 1구역 — 계산기 (상단)
1. **실시간 시세 조회**: 외부 API로 현재 금/은시세 + 환율 fetch
2. **단위 선택 입력**: g / 돈 / 냥 탭
3. **순도 선택**: 금 — 24K / 18K / 14K, 은 — 999 / 925 / 900 / 800
4. **원화 환산 결과 표시**: 입력값에 따라 즉시 계산
5. **시세 업데이트 시각 표시**: 마지막 조회 시간

### 2구역 — 날짜별 시세 변동 내역 (중단)
6. **기간별 시세 히스토리 차트**: 1주 / 1개월 / 3개월 / 1년 탭 선택
   - 라인 차트로 USD/oz 및 원화/g 동시 표시 (이중 Y축)
   - 국내 금: 원/g 단일 Y축
   - 차트 라이브러리: Recharts ComposedChart
7. **일별 시세 테이블**: 날짜 / 시세 / 환율 / 원화/g / 전일 대비 등락 표시
   - 등락은 색상+아이콘으로 구분 (상승: 빨강▲, 하락: 파랑▼ — 한국 증시 관례)
8. **최고가 / 최저가 / 평균가** 요약 배지 표시

### 3구역 — 시세 예측 (하단, 국제 금/은만)
9. **단기 예측 표시**: 향후 7일 / 30일 예측 시세 트렌드 차트
   - 과거 실제값(실선) + 예측값(점선) + 신뢰 구간(반투명 영역)
10. **예측 방법론 표기**: MA5/MA20 이동평균 + 선형 회귀 기반
11. **예측 면책 문구 필수 표시**: 항상 렌더링, 조건부/숨김 처리 절대 금지
12. **주요 시장 신호 요약**: DXY / 미국 국채 10년물 / VIX 지수

## API 연동

### 금시세 (현재가 + 히스토리)
- [GoldAPI.io](https://www.goldapi.io/) — 현재가 및 날짜별 히스토리 지원
  - 현재가: `GET https://www.goldapi.io/api/XAU/USD`
  - 히스토리: `GET https://www.goldapi.io/api/XAU/USD/YYYYMMDD`

### 환율
- [ExchangeRate-API](https://www.exchangerate-api.com/)
  - `GET https://v6.exchangerate-api.com/v6/{API_KEY}/latest/USD`

### 은시세
- [gold-api.com](https://gold-api.com/) — 무료, 인증 불필요
  - 현재가: `GET https://api.gold-api.com/price/XAG`

### 국내 금시세
- [data.go.kr 공공데이터포털](https://www.data.go.kr/) — 무료, serviceKey 필요
  - Railway Express 서버 프록시 경유: `/api/domestic-gold`

### 예측용 보조 지표 (선택)
- 달러 인덱스(DXY), VIX: [Alpha Vantage](https://www.alphavantage.co/) 무료 플랜
- 미국 국채 10년물 금리: FRED API
  - `GET https://api.stlouisfed.org/fred/series/observations?series_id=DGS10`

### API 키 환경변수
```
VITE_GOLD_API_KEY=              # GoldAPI.io 인증 키
VITE_GOLD_API_URL=              # https://www.goldapi.io/api
VITE_EXCHANGE_RATE_API_KEY=     # ExchangeRate-API 키
VITE_EXCHANGE_RATE_API_URL=     # https://v6.exchangerate-api.com/v6
VITE_ALPHA_VANTAGE_KEY=         # 보조 지표용 (선택)
VITE_FRED_API_KEY=              # FRED API (선택)
DATA_GO_KR_API_KEY=             # 공공데이터포털 serviceKey (Railway 서버사이드 전용)
```
- API 키는 `.env` 파일에 저장 — `.env.example`에 키 이름만 명시하고 커밋
- GitHub Secrets에도 동일한 이름으로 등록 (CI/CD 참고: docs/05-cicd.md)

## 페이지 레이아웃 구조

```
┌─────────────────────────────────────────┐
│  [국제 금] [국제 은] [국내 금] [국내 은]  ← 자산 탭  │
├─────────────────────────────────────────┤
│  (선택된 탭에 따라 아래 구역 렌더링)       │
│  [1구역] 계산기                          │
│  현재 시세 + 단위/순도 선택 + 원화 환산    │
├─────────────────────────────────────────┤
│  [2구역] 날짜별 시세 변동 내역            │
│  기간 탭: 1주 | 1개월 | 3개월 | 1년      │
│  ┌─────────────────────────────────┐    │
│  │  라인 차트 (USD/oz + 원화/g)     │    │
│  └─────────────────────────────────┘    │
│  최고가 | 최저가 | 평균가 배지           │
│  ┌─────────────────────────────────┐    │
│  │  날짜별 시세 테이블 (등락 색상)   │    │
│  └─────────────────────────────────┘    │
├─────────────────────────────────────────┤
│  [3구역] 시세 예측 (국제 금/은만)         │
│  ┌─────────────────────────────────┐    │
│  │  과거(실선) + 예측(점선+신뢰구간) │    │
│  └─────────────────────────────────┘    │
│  주요 시장 신호 요약 텍스트              │
│  ⚠️ 투자 조언 아님 면책 문구 (필수)     │
└─────────────────────────────────────────┘
```

## 프로젝트 구조

```
GoldCalc/
├── .github/
│   ├── workflows/
│   │   └── ci.yml               # PR 검증 (lint + type-check + test + build)
│   └── pull_request_template.md # PR 체크리스트 템플릿
├── server.js                    # Railway Express 서버 (SPA 서빙 + 국내 금시세 프록시)
├── railway.json                 # Railway 빌드/배포 설정
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.tsx       # 앱 헤더
│   │   │   ├── AssetNav.tsx     # 자산 탭 네비게이션 ([국제 금][국제 은][국내 금])
│   │   │   ├── PriceBar.tsx     # 현재 시세 요약 바
│   │   │   ├── OfflineBanner.tsx # 오프라인 감지 배너
│   │   │   └── Footer.tsx       # 푸터
│   │   ├── common/
│   │   │   └── ErrorAlert.tsx   # 공통 에러 Alert (재시도 버튼 포함)
│   │   ├── calculator/
│   │   │   ├── CalculatorSection.tsx # 1구역 진입점 (Sprint 01 플레이스홀더 → Sprint 02 완성)
│   │   │   ├── GoldCalculator.tsx    # 메인 계산기 컴포넌트 (Sprint 02)
│   │   │   ├── MetalCalculator.tsx   # 금/은 공통 계산기
│   │   │   ├── UnitSelector.tsx      # g/돈/냥 단위 선택 (Sprint 02)
│   │   │   ├── PuritySelector.tsx    # 순도 선택 (Sprint 02)
│   │   │   └── PriceDisplay.tsx      # 원화 환산 결과 표시 (Sprint 02)
│   │   ├── history/
│   │   │   ├── HistorySection.tsx    # 2구역 진입점 (Sprint 03)
│   │   │   ├── PriceChart.tsx        # Recharts 이중 Y축 차트 (Sprint 03)
│   │   │   ├── PriceTable.tsx        # 날짜별 시세 테이블 (Sprint 03)
│   │   │   ├── PriceSummary.tsx      # 최고/최저/평균 배지 (Sprint 03)
│   │   │   └── ChartSkeleton.tsx     # 차트 로딩 스켈레톤 (Sprint 03)
│   │   ├── domestic/
│   │   │   ├── DomesticGoldSection.tsx  # 국내금 전용 섹션
│   │   │   └── DomesticSilverSection.tsx # 국내은 전용 섹션 (XAG→KRW 환산)
│   │   └── forecast/
│   │       ├── ForecastSection.tsx   # 3구역 진입점 (Sprint 04)
│   │       ├── ForecastChart.tsx     # 과거+예측 통합 차트 (Sprint 04)
│   │       ├── MarketSignals.tsx     # 시장 신호 요약 카드 (Sprint 04)
│   │       ├── TrendBadge.tsx        # 상승세/하락세 배지 (Sprint 04)
│   │       └── Disclaimer.tsx        # 면책 문구 — 항상 렌더링, 조건부 금지 (Sprint 04)
│   ├── hooks/
│   │   ├── useGoldPrice.ts          # 현재 금시세 fetch (TanStack Query)
│   │   ├── useGoldHistory.ts        # 기간별 히스토리 fetch (TanStack Query)
│   │   ├── useSilverPrice.ts        # 현재 은시세 fetch (TanStack Query)
│   │   ├── useSilverHistory.ts      # 기간별 은시세 히스토리 fetch (TanStack Query)
│   │   ├── useDomesticGoldPrice.ts  # 국내 금시세 fetch (TanStack Query)
│   │   ├── useDomesticGoldHistory.ts # 국내 금시세 히스토리 fetch (TanStack Query)
│   │   ├── useExchangeRate.ts       # 환율 fetch (TanStack Query)
│   │   ├── useForecast.ts           # 예측 데이터 계산 (useMemo 기반)
│   │   ├── useMarketSignals.ts      # 시장 신호 fetch (TanStack Query)
│   │   └── useOnlineStatus.ts       # 네트워크 온/오프라인 감지
│   ├── utils/
│   │   ├── metalCalc.ts             # 통합 계산 유틸 (금/은 환산 순수 함수)
│   │   ├── goldCalc.ts              # re-export 래퍼 (metalCalc.ts 호환)
│   │   ├── historyCalc.ts           # 등락률·최고/최저/평균 계산
│   │   ├── forecast.ts              # MA/선형회귀 예측 알고리즘
│   │   ├── format.ts                # 숫자·날짜 포맷 유틸
│   │   └── api.ts                   # fetch 래퍼 (에러 표준화)
│   ├── types/
│   │   └── gold.ts                  # 공유 타입 정의
│   ├── test/
│   │   ├── setup.ts                 # Vitest 전역 설정 + MSW 생명주기
│   │   ├── mocks/
│   │   │   ├── server.ts            # MSW 서버
│   │   │   ├── handlers.ts          # 정상 응답 핸들러
│   │   │   └── errorHandlers.ts     # 에러 시나리오 핸들러
│   │   ├── fixtures/
│   │   │   └── goldData.ts          # 고정 테스트 데이터
│   │   ├── utils/
│   │   │   └── renderWithProviders.tsx  # QueryClient 포함 커스텀 렌더
│   │   └── functional/              # 기능 테스트 (E2E 시나리오)
│   └── App.tsx
├── .env                             # API 키 (git 제외)
├── .env.example                     # API 키 템플릿 (git 포함)
├── CLAUDE.md
├── docs/
│   ├── 01-prd.md                # 제품 요구사항
│   ├── 02-techstack.md          # 기술 스택 선정 근거
│   ├── 03-skills.md             # 구현 패턴 및 코드 예시
│   ├── 04-testing.md            # 테스트 전략 및 케이스 명세
│   ├── 05-cicd.md               # CI/CD 파이프라인
│   ├── 06~10-sprint-01~05.md    # Sprint별 구현 체크리스트
│   ├── 11-decisions.md          # 의사결정 필요 사항
│   └── 12-api-key-guide.md     # API 키 발급 가이드
```

## 개발 규칙

### 공통
- 계산 로직은 `utils/metalCalc.ts`에 순수 함수로 분리 — 컴포넌트에 직접 작성 금지
- API 호출은 TanStack Query 훅으로만 처리 — 컴포넌트에서 직접 fetch / useEffect fetch 금지
- 소수점은 원화 표시 시 원 단위 반올림 (Math.round)
- 원화 표시 형식: `₩146,500` (₩ 접두사 + toLocaleString('ko-KR') 천 단위 콤마)
- 숫자 표시는 `toLocaleString('ko-KR')` 사용하여 천 단위 콤마
- QueryClient 기본 staleTime: 60초, retry: 2회
- API 에러 시 TanStack Query의 마지막 캐시값 유지 + ErrorAlert 표시
- `.env` 파일은 절대 커밋하지 않음

### 차트 (Recharts)
- 히스토리·예측 차트 모두 Recharts `ComposedChart` 사용
- 등락 색상: 상승 `#ef4444`(빨강▲), 하락 `#3b82f6`(파랑▼) — 한국 증시 관례
- 색상만으로 구분하지 않음 — 아이콘(▲▼) + aria-label 병행 필수
- 예측 신뢰 구간: `Area`로 투명도 0.15 처리
- 과거 실제값: 실선, 예측값: 점선(`strokeDasharray="5 5"`)

### 예측 알고리즘 (`utils/forecast.ts`)
- MA5(5일 이동평균), MA20(20일 이동평균) 교차로 트렌드 방향 판단
- 선형 회귀로 향후 7일/30일 예측값 산출
- 신뢰 구간: 과거 90일 데이터의 표준편차 기반 ±1σ 범위
- 예측 결과는 절대 투자 조언으로 표현 금지 — `Disclaimer` 컴포넌트 항상 렌더링

### 테스트
- 순수 함수(`utils/`)는 단위 테스트 커버리지 100% 목표
- 모든 테스트 가능 컴포넌트에 `data-testid` 속성 필수 추가 (docs/04-testing.md 참고)
- API 호출 테스트는 반드시 MSW 모킹 사용 — 실제 API 호출 금지
- PR 생성 시 GitHub Actions CI가 자동으로 테스트 실행 (cicd.md 참고)

## 실행 방법

```bash
npm install
npm run dev           # 개발 서버 (localhost:5173)
npm run build         # 프로덕션 빌드
npm run preview       # 빌드 결과 미리보기

# 테스트
npm run test          # 전체 테스트 실행
npm run test:watch    # watch 모드
npm run test:coverage # 커버리지 포함
npm run lint          # ESLint 검사
npm run type-check    # TypeScript 타입 검사
```

## 배포

- **자동 배포**: Railway 대시보드에서 GitHub 저장소 연결 → main push 시 자동 프로덕션 배포
- **PR 프리뷰**: Railway PR Environments 활성화 시 PR마다 프리뷰 URL 자동 생성
- **CI 검증**: GitHub Actions(`ci.yml`)가 PR 시 lint + type-check + test + build 자동 실행
- **SPA 라우팅**: `server.js` Express 서버가 모든 경로를 `index.html`로 폴백 처리
- **프록시**: `server.js`가 `/api/domestic-gold` 엔드포인트로 data.go.kr 프록시 처리
- **상세 설정**: `docs/05-cicd.md` 참고

## 관련 문서

| 문서 | 내용 |
|------|------|
| `docs/01-prd.md` | 제품 요구사항 (기능/비기능) |
| `docs/02-techstack.md` | 기술 스택 선정 근거 |
| `docs/03-skills.md` | 구현 패턴 및 코드 예시 |
| `docs/04-testing.md` | 테스트 전략 및 케이스 명세 |
| `docs/05-cicd.md` | CI/CD 파이프라인 및 GitHub 연동 |
| `docs/06~10-sprint-*.md` | Sprint별 구현 체크리스트 |
| `docs/11-decisions.md` | 은시세·국내금시세 확장 의사결정 사항 |
| `docs/12-api-key-guide.md` | API 키 발급 가이드 (비개발자용) |
