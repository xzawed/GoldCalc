# Sprint 01 — 프로젝트 초기 설정 및 기반 구축

**목표**: 개발 환경과 공통 기반 코드를 완성하여 이후 Sprint가 막힘 없이 진행될 수 있는 토대 마련
**기간**: 2일
**결과물**: 앱이 실행되고, 공통 타입·유틸·레이아웃이 준비된 상태
**상태**: ✅ 완료

---

## 체크리스트

### [x] 1-1. Vite + React + TypeScript 프로젝트 생성

- `package.json`, `vite.config.ts`, `tsconfig*.json`, `index.html` 생성
- `npm install` 완료

---

### [x] 1-2. Tailwind CSS 설정

- `tailwind.config.js` — content 경로 + `gold` 색상 팔레트 + CSS 변수 기반 shadcn 색상
- `postcss.config.js`, `src/index.css` — Tailwind 지시어 + 테마 CSS 변수

---

### [x] 1-3. shadcn/ui 컴포넌트 수동 구성

- `components.json` — style=default, baseColor=zinc, cssVariables=true
- `src/components/ui/`: badge, button, card, tabs, skeleton, alert, select, input

---

### [x] 1-4. TanStack Query Provider 설정

- `src/main.tsx` — QueryClientProvider, staleTime=60s, retry=2

---

### [x] 1-5. 추가 패키지 설치

- dependencies: `@tanstack/react-query`, `recharts`, `date-fns`, `clsx`, `tailwind-merge`
- devDependencies: `vitest`, `@vitest/coverage-v8`, `msw`, `@testing-library/react`, `@testing-library/jest-dom`

---

### [x] 1-6. 환경변수 파일 설정

- `.env.example` — 4개 VITE_ 변수명 (값 비움)
- `.gitignore` — `.env` 제외 확인

---

### [x] 1-7. 타입 정의 (`src/types/gold.ts`)

- `WeightUnit`, `Purity`, `Period`, `ForecastDays`
- `GoldPriceResponse`, `HistoryEntry`, `ForecastPoint`, `MarketSignal`, `PeriodSummary`

---

### [x] 1-8. 공통 유틸 함수

- `src/utils/format.ts` — `formatKRW` (₩ 접두사), `formatUSD`, `formatChangeRate`, `getChangeColor`, `getChangeIcon`, `formatDate`
- `src/utils/api.ts` — `apiFetch<T>()` 제네릭 래퍼
- `src/lib/utils.ts` — `cn()` (clsx + tailwind-merge)

---

### [x] 1-9. 레이아웃 컴포넌트 (`src/components/layout/`)

- `Header.tsx` — 앱 타이틀 + 서브타이틀
- `PriceBar.tsx` — 현재 금시세 요약 바 (TanStack Query useQuery 사용)
- `Footer.tsx` — 데이터 출처 표기
- `OfflineBanner.tsx` — 오프라인 감지 배너
- `src/components/common/ErrorAlert.tsx` — 공통 오류 Alert
- `src/hooks/useOnlineStatus.ts` — navigator.onLine 훅
- `src/App.tsx` — 세 구역 lazy 로드 레이아웃
- 섹션 플레이스홀더: `CalculatorSection`, `HistorySection`, `ForecastSection`

---

### [x] 1-10. Vitest 설정

- `vite.config.ts` — jsdom 환경, setupFiles, coverage v8, `@/*` path alias
- 커버리지 임계: lines/functions 80%, branches 70%

---

### [x] 1-11. 테스트 인프라 구축

- `src/test/setup.ts` — MSW lifecycle (beforeAll/afterEach/afterAll)
- `src/test/mocks/server.ts` — MSW setupServer
- `src/test/mocks/handlers.ts` — 정상 응답 핸들러
- `src/test/mocks/errorHandlers.ts` — 에러 응답 핸들러
- `src/test/fixtures/goldData.ts` — 고정 테스트 데이터
- `src/test/utils/renderWithProviders.tsx` — QueryClientProvider 포함 커스텀 렌더
- `src/utils/format.test.ts` — UT-04 (12개 테스트, 전체 통과)

---

### [x] 1-12. GitHub Actions CI 설정

- `.github/workflows/ci.yml` — lint → type-check → test:coverage → build
- `.github/pull_request_template.md` — PR 체크리스트 템플릿

---

## Sprint 01 완료 기준

- [x] `npm run dev` 정상 실행, 기본 레이아웃 화면 표시
- [x] `npm run build` 에러 없이 빌드 성공 (dist/ 생성)
- [x] `npm run test` 12개 테스트 전체 통과
- [x] `npm run lint` 에러/경고 0건
- [x] `npm run type-check` TypeScript 에러 0건
- [x] MSW 서버 `server.listen()` 정상 동작 확인
- [x] `.env` 파일 gitignore 동작 확인
