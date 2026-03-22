# Sprint 05 — 품질 개선 및 배포

**목표**: 반응형 완성, 접근성 개선, 성능 최적화, 에러 시나리오 전체 검증 후 Railway 배포
**기간**: 2일
**선행 조건**: Sprint 01~04 모두 완료
**결과물**: 프로덕션 배포 완료, 모바일/데스크톱 정상 동작
**상태**: ✅ 코드 완료 / ✅ Railway 배포 완료

---

## 체크리스트

### [x] 5-1. 반응형 레이아웃

모든 컴포넌트 Tailwind 반응형 클래스 적용:
- `PriceBar`: `flex-wrap`으로 모바일 2줄 처리
- `GoldCalculator`: 입력 full-width, 탭 전체 너비
- `PriceChart` / `ForecastChart`: `ResponsiveContainer` 100% width
- `PriceSummary`: `flex-wrap gap-3` (모바일 세로 스택)
- `PriceTable`: `overflow-x-auto`
- `MarketSignals`: `grid-cols-1 sm:grid-cols-2`

---

### [x] 5-2. 에러 시나리오 처리

| 시나리오 | 처리 |
|---------|------|
| 금시세 API 실패 | ErrorAlert + 계산기 비표시 |
| 환율 API 실패 | ErrorAlert 표시 |
| 히스토리 데이터 없음 | "데이터가 없습니다" 메시지 |
| 네트워크 오프라인 | OfflineBanner (기존 구현) |
| 예측 데이터 부족 | 빈 배열 처리 (차트 미표시) |
| 시장 신호 API 실패 | fallback 값 (value: 0) 표시 |

`src/test/mocks/errorHandlers.ts` 구현 완료.

---

### [x] 5-3. 접근성(a11y) 개선

- 등락 표시: 색상 + 아이콘(▲▼) + `aria-label` 병행 (모든 컴포넌트)
- 탭 컴포넌트: shadcn/ui 기본 키보드 탐색 지원
- 차트: `role="img"` + `aria-label` 적용
- 동적 수치: `aria-live="polite"` 적용 (PriceDisplay)
- 시세 변화: `aria-label`에 텍스트 설명 포함

---

### [x] 5-4. 성능 최적화

코드 스플리팅:
- `HistorySection`: `lazy()` + `Suspense` (App.tsx)
- `ForecastSection`: `lazy()` + `Suspense` (App.tsx)
- `CalculatorSection`: `lazy()` + `Suspense` (App.tsx)

React.memo:
- `MarketSignals` — `React.memo` 적용
- `PriceTable` — `addChangeRates` 결과 메모이제이션

번들 크기 (빌드 결과):
- 초기 번들(`index.js`): **213 kB** (목표 500KB 이하 ✅)
- 전체 gzip: 약 127 kB (초기)

---

### [x] 5-5. 통합 테스트

- `src/test/functional/calculator.test.tsx` — 10개 테스트
- `src/test/functional/history.test.tsx` — 7개 테스트
- `src/test/functional/forecast.test.tsx` — 9개 테스트

**전체 102개 테스트 통과.**

---

### [x] 5-6. GitHub Actions CI

`.github/workflows/ci.yml` — Sprint 01에서 구현 완료.
PR 시 lint → type-check → test → build 자동 실행.

---

### [x] 5-6-b. Railway 배포

1. [railway.app](https://railway.app) → GitHub 계정 로그인
2. **New Project** → **Deploy from GitHub repo** → `GoldCalc` 저장소 선택
3. `railway.json` 자동 감지 → `npm run build` → `node server.js` 실행
4. **Variables** 탭에서 환경변수 등록:
   ```
   VITE_GOLD_API_KEY=<GoldAPI.io 키>
   VITE_EXCHANGE_RATE_API_KEY=<ExchangeRate-API 키>
   VITE_GOLD_API_URL=https://www.goldapi.io/api
   VITE_EXCHANGE_RATE_API_URL=https://v6.exchangerate-api.com/v6
   VITE_ALPHA_VANTAGE_KEY=<선택사항>
   VITE_FRED_API_KEY=<선택사항>
   DATA_GO_KR_API_KEY=<공공데이터포털 키>
   ```
5. Settings → Domains에서 자동 생성된 배포 URL 확인

---

### [x] 5-7. 최종 빌드 검증

| 항목 | 결과 |
|------|------|
| TypeScript 에러 0건 | ✅ |
| ESLint 에러 0건 | ✅ |
| 전체 테스트 통과 (102개) | ✅ |
| 초기 JS 번들 500KB 이하 (213kB) | ✅ |
| 면책 문구 표시 확인 | ✅ |
| `.env` gitignore 동작 확인 | ✅ |
| Railway 프로덕션 배포 | ✅ https://goldcalc.up.railway.app |

---

## Sprint 05 완료 기준

- [x] 모바일/데스크톱 전 구역 레이아웃 깨짐 없음 (Tailwind 반응형)
- [x] 에러 시나리오 처리 (ErrorAlert, fallback 값)
- [x] 접근성: 등락 아이콘+색상 병행, aria-label 적용
- [x] 초기 JS 번들 213kB (500KB 이하 목표 달성)
- [x] GitHub Actions CI 통과
- [x] Railway 프로덕션 배포 완료 및 URL 확인 → https://goldcalc.up.railway.app
- [ ] Branch Protection Rules ← **GitHub 웹에서 수동 설정 필요**
