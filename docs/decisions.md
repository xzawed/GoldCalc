# Decisions — 아키텍처 의사결정 기록 (ADR)

> 결정된 사항만 기록. "왜 이렇게 만들었는가"를 보존하여 동일 결정 반복 방지.

---

## ADR-001: React SPA + Vite (SSR 미적용)

**상태:** 확정  
**결정:** Next.js 대신 React + Vite CSR SPA 사용  
**이유:** 실시간 데이터 계산기는 SSR/SEO 이점 없음. Next.js는 복잡도만 증가.  
**기각:** Next.js (SSR 불필요), Remix (과잉)

---

## ADR-002: TanStack Query (직접 useEffect 금지)

**상태:** 확정  
**결정:** 모든 API 호출은 TanStack Query 훅으로만 처리  
**이유:** 로딩/에러 상태, 중복 요청 방지, staleTime 캐싱, 백그라운드 갱신을 자동 처리. `useEffect + fetch` 직접 구현 대비 40% 이상 코드 절감.  
**규칙:** 컴포넌트에서 직접 `fetch()` 또는 `useEffect`로 API 호출 절대 금지.

---

## ADR-003: 서버사이드 API 프록시 (API 키 클라이언트 노출 방지)

**상태:** 확정 (2026-04-13 적용)  
**결정:** GoldAPI.io, ExchangeRate-API, FRED, Alpha Vantage 호출을 모두 `server.js` 프록시 경유  
**이유:** `VITE_*` 환경변수는 클라이언트 번들에 포함되어 브라우저에서 추출 가능. API 키 도용 위험.  
**구현:** Railway 서버사이드 변수(`VITE_` 접두사 없음) → `server.js`에서 읽어 프록시.  
**예외:** 없음. 은시세도 ADR-009에 따라 GoldAPI.io 프록시 경유로 통일.

---

## ADR-004: Railway → Supabase Circuit Breaker 페일오버

**상태:** 확정  
**결정:** 국내금 API에 한해 Railway 장애 시 Supabase Edge Function으로 자동 전환  
**이유:** data.go.kr은 CORS 미지원으로 서버 프록시 필수. Railway 단일 장애점 해소.  
**구현:**
- `src/utils/fetchWithFailover.ts` — `Promise.race` 기반 5초 타임아웃
- Circuit Breaker: 실패 후 60초간 Supabase 우선
- `VITE_SUPABASE_URL` 미설정 시 비활성  
**대상:** `useDomesticGoldPrice`, `useDomesticGoldHistory`만 적용 (국제 금/은은 해당 없음)

---

## ADR-005: 국내은 = 국제 XAG/USD × 환율 (KRX 은 현물시장 없음)

**상태:** 확정 (2026-03-23)  
**결정:** 국내은 시세를 `국제 XAG/USD × USD/KRW 환율`로 환산  
**이유:** KRX(한국거래소)에 금 현물 시장만 존재, 은 현물 시장 없음. data.go.kr에 은시세 API 없음. 국내 귀금속 소매 업계 관행과 동일.  
**구현:** `DomesticSilverSection` — `useSilverPrice` + `useExchangeRate` 재활용. 별도 API 불필요.  
**UI:** 면책 안내 문구에 "KRX 은 현물 시장 없음, 국제 시세 환율 환산 기준" 명시.

---

## ADR-006: Recharts ComposedChart (D3 직접 사용 금지)

**상태:** 확정  
**결정:** 모든 차트를 Recharts `ComposedChart`로 구현  
**이유:** React 컴포넌트 방식, 이중 Y축 기본 지원, 번들 크기 ~150KB (Nivo ~500KB 대비), `ResponsiveContainer` 반응형 기본 지원.  
**규칙:** D3, Chart.js, Nivo 직접 사용 금지.

---

## ADR-007: shadcn/ui (MUI 미사용)

**상태:** 확정  
**결정:** UI 컴포넌트로 shadcn/ui 사용  
**이유:** Tailwind 기반 복사형 컴포넌트 — 커스터마이징 자유도 최고, 번들에 미포함. MUI는 번들 크기 크고 커스터마이징 복잡.  
**설치 방법:** `npx shadcn@latest add <component>` (패키지 의존성 없음)

---

## ADR-008: 계산 로직 metalCalc.ts 집중화

**상태:** 확정  
**결정:** 모든 금/은 계산 로직을 `src/utils/metalCalc.ts` 순수 함수로 분리  
**이유:** 컴포넌트에 직접 작성 시 테스트 불가, 중복 발생, 수정 시 누락 위험.  
**규칙:** 컴포넌트에서 직접 금 가격 계산 절대 금지. `metalCalc.ts` 함수만 사용.


---

## ADR-009: 은시세 히스토리 데이터 소스를 GoldAPI.io XAG 프록시로 이관

**상태:** 확정 (2026-04-13)  
**결정:** `useSilverPrice`/`useSilverHistory`의 `api.gold-api.com` 직접 호출을 `server.js` 프록시(`/api/silver-price`, `/api/silver-history`)로 교체. 기존 `GOLD_API_KEY` 재사용.  
**이유:**
1. `api.gold-api.com/price/XAG?date=YYYYMMDD` 히스토리 엔드포인트가 404 반환 (E2E 확인) → 은 히스토리 데이터 0개 → ForecastSection 예측 불가
2. 대안 Stooq(`stooq.com/q/d/l/?s=xagusd`)가 캡차 기반 API 키 등록 요구로 "무인증 CSV" 특성 소멸
3. GoldAPI.io `/XAG/USD/{YYYYMMDD}` 엔드포인트 존재 확인 (HTTP 403, 엔드포인트 살아있음), 기존 `GOLD_API_KEY`로 XAG 호출 가능 → 새 env 변수 불필요  
**효과:** 은 히스토리 데이터 복구 → `intl-silver` 예측 차트 정상화. `domestic-silver` 탭에 `ForecastSection metal="silver"` 라우팅 추가.  
**기각:** Stooq CSV (API 키 등록 필요), metals.dev 무료 티어 (새 env 변수 필요, 월 한도 불명확), Yahoo Finance SI=F (TOS 위반 가능성)

---

## ADR-010: 탭별 히스토리 기간 버튼 완전 숨김 (Option A)

**상태:** 확정 (2026-04-13)  
**결정:** 데이터 소스가 지원하지 않는 기간 버튼을 완전 숨김 처리 (렌더 자체 제거)  
**배경:** 금 탭(4종: 1W/1M/3M/1Y)과 은 탭(2종: 1M/1Y)의 실질 데이터 범위가 다름. 미지원 버튼을 그대로 두면 빈 차트·빈 테이블로 UX 혼란 유발.  
**구현:**
- `AssetTabConfig`에 `supportedPeriods: Period[]` 필드 추가 (`src/types/gold.ts`)
- `getSupportedPeriodOptions(tabKey)` 헬퍼로 탭별 필터링
- `HistorySection`, `DomesticGoldSection`, `DomesticSilverSection` 모두 `PERIOD_OPTIONS` 대신 `getSupportedPeriodOptions` 사용
- `HistorySection`: metal 전환 시 미지원 period 자동 리셋 (`useEffect`)  
**기각:**
- Option B (비활성화): 버튼을 흐리게 표시 — "왜 안 되는지" 안내 문구 필요, 코드 복잡도 증가
- Option C (동적 판단): API 응답 데이터 건수로 런타임 판단 — 로딩 중 깜박임, 불확실성 증가  
**규칙:** 새로운 히스토리 섹션 추가 시 `PERIOD_OPTIONS` 직접 사용 금지, 반드시 `getSupportedPeriodOptions(tabKey)` 경유.
