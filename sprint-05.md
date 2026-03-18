# Sprint 05 — 품질 개선 및 배포

**목표**: 반응형 완성, 접근성 개선, 성능 최적화, 에러 시나리오 전체 검증 후 Vercel 배포
**기간**: 2일
**선행 조건**: Sprint 01~04 모두 완료
**결과물**: 프로덕션 배포 완료, 모바일/데스크톱 정상 동작

---

## 체크리스트

### [ ] 5-1. 반응형 레이아웃 완성

모든 컴포넌트의 모바일(< 768px) / 데스크톱(≥ 1024px) 레이아웃 점검.

| 컴포넌트 | 모바일 처리 |
|---------|------------|
| `PriceBar` | 2줄로 wrapping (시세 / 환율 분리) |
| `GoldCalculator` | 단위 탭 전체 너비, 입력 필드 full-width |
| `PriceChart` | 높이 220px, X축 레이블 축소 (월/일 → 일) |
| `PriceSummary` | 배지 3개 세로 스택 |
| `PriceTable` | 가로 스크롤 허용 (`overflow-x-auto`) |
| `ForecastChart` | 높이 220px |
| `MarketSignals` | 카드 세로 스택 |

Tailwind 반응형 클래스 패턴:
```tsx
// 모바일: 1열 / 데스크톱: 3열
<div className="grid grid-cols-1 md:grid-cols-3 gap-4">

// 차트 높이 반응형
<ResponsiveContainer width="100%" height={window.innerWidth < 768 ? 220 : 350}>
```

---

### [ ] 5-2. 에러 시나리오 전체 점검

| 시나리오 | 기대 동작 |
|---------|----------|
| 금시세 API 키 없음/만료 | 에러 Alert + "시세를 불러올 수 없습니다" + Skeleton 유지 |
| 환율 API 실패 | 에러 Alert + 계산기 입력 비활성화 |
| 히스토리 API rate limit 초과 | "데이터 조회 한도를 초과했습니다. 잠시 후 다시 시도해주세요" |
| 네트워크 오프라인 | 상단 노란 배너 "인터넷 연결을 확인해주세요" |
| 히스토리 데이터 부족 (< 30일) | 예측 섹션에 "데이터가 부족하여 예측을 표시할 수 없습니다" |
| 모든 API 성공, 환율만 캐시 | 캐시값으로 계산 + 업데이트 시각 표시 |

오프라인 감지 구현:
```ts
// src/hooks/useOnlineStatus.ts
export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  return isOnline;
}
```

---

### [ ] 5-3. 접근성(a11y) 개선

- [ ] 등락 표시: 색상 + 아이콘(▲▼) + `aria-label` 병행
  ```tsx
  <span
    className={getChangeColor(rate)}
    aria-label={`${rate > 0 ? '상승' : '하락'} ${Math.abs(rate).toFixed(2)}퍼센트`}
  >
    {getChangeIcon(rate)} {formatChangeRate(rate)}
  </span>
  ```
- [ ] 탭 컴포넌트 키보드 탐색 가능 확인 (shadcn/ui 기본 지원)
- [ ] 차트에 `role="img"` + `aria-label` 추가
  ```tsx
  <div role="img" aria-label={`${period} 금시세 변동 차트`}>
    <ResponsiveContainer>...</ResponsiveContainer>
  </div>
  ```
- [ ] 주요 수치에 `aria-live="polite"` 적용 (시세 자동 갱신 시 스크린리더 알림)
  ```tsx
  <div aria-live="polite" aria-atomic="true">
    {formatKRW(totalKRW)}
  </div>
  ```
- [ ] 색상 대비 비율 WCAG AA 기준(4.5:1) 충족 확인

---

### [ ] 5-4. 성능 최적화

#### 코드 스플리팅 (지연 로딩)

히스토리와 예측 섹션은 초기 로드에 필수가 아니므로 lazy 처리:

```tsx
// src/App.tsx
import { lazy, Suspense } from 'react';

const PriceHistory = lazy(() => import('./components/history/PriceHistory'));
const GoldForecast = lazy(() => import('./components/forecast/GoldForecast'));

<Suspense fallback={<SectionSkeleton />}>
  <PriceHistory />
</Suspense>
<Suspense fallback={<SectionSkeleton />}>
  <GoldForecast />
</Suspense>
```

#### React.memo 적용

재렌더링이 잦은 컴포넌트에 메모이제이션:
```tsx
export const PriceTable = React.memo(function PriceTable({ entries }) { ... });
export const MarketSignals = React.memo(function MarketSignals({ signals }) { ... });
```

#### 번들 크기 확인

```bash
npm run build
# dist/assets/index-*.js 파일 크기 확인 → 500KB 이하 목표
npx vite-bundle-analyzer  # 선택사항: 번들 시각화
```

---

### [ ] 5-5. 통합 테스트

MSW로 API 모킹 후 주요 사용자 플로우 테스트.

```ts
// src/test/mocks/handlers.ts
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('https://www.goldapi.io/api/XAU/USD', () =>
    HttpResponse.json({ price: 2650.0, timestamp: Date.now() / 1000 })
  ),
  http.get('https://v6.exchangerate-api.com/*', () =>
    HttpResponse.json({ conversion_rates: { KRW: 1320 } })
  ),
];
```

테스트 시나리오:
```ts
// src/test/calculator.test.tsx
test('금시세 로드 후 1돈 계산 결과 표시', async () => {
  render(<App />);
  await waitFor(() => expect(screen.getByText(/돈/)).toBeInTheDocument());
  // 1돈 입력 → 원화 환산값 확인
});

test('API 에러 시 에러 메시지 표시', async () => {
  server.use(
    http.get('https://www.goldapi.io/*', () => HttpResponse.error())
  );
  render(<App />);
  await waitFor(() =>
    expect(screen.getByText(/불러올 수 없습니다/)).toBeInTheDocument()
  );
});
```

---

### [ ] 5-6. Vercel × GitHub 자동 배포 연동

> 자세한 내용은 `cicd.md` 섹션 4 참고.
> `deploy.yml`·`preview.yml` 파일 생성 불필요 — Vercel이 GitHub를 직접 감시하여 자동 처리.

**Vercel 설정 (1회만)**
1. [vercel.com](https://vercel.com) → GitHub 계정으로 로그인
2. **Add New Project** → GitHub 저장소 `goldcalc` 선택 → Import
3. Framework Preset: **Vite** 자동 감지 확인
4. **Environment Variables** 등록:
   ```
   VITE_GOLD_API_KEY
   VITE_EXCHANGE_API_KEY
   VITE_ALPHA_VANTAGE_KEY   (선택)
   VITE_FRED_API_KEY        (선택)
   ```
5. **Deploy** 클릭 → 첫 배포 완료

**이후 자동 동작**
- `main` push → Vercel 프로덕션 자동 배포
- PR 생성 → Vercel 프리뷰 URL 자동 생성 + PR 코멘트 등록

**SPA 라우팅 처리** — 프로젝트 루트에 `vercel.json` 생성:
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

배포 후 확인:
- [ ] 프로덕션 URL 접속 정상
- [ ] API 호출 정상 (브라우저 네트워크 탭 확인)
- [ ] 환경변수 주입 정상 (소스에 API 키 노출 없음 확인)
- [ ] `CLAUDE.md`에 배포 URL 기재

---

### [ ] 5-6-b. GitHub Actions CI 및 저장소 설정

> 자세한 내용은 `cicd.md` 참고. `deploy.yml`·`preview.yml`은 생성하지 않음.

- [ ] `vercel.json` 생성 (SPA 라우팅 rewrite 규칙)
- [ ] `.github/workflows/ci.yml` 생성 (cicd.md 섹션 5 코드)
- [ ] `.github/pull_request_template.md` 생성 (cicd.md 섹션 8 코드)
- [ ] GitHub Secrets **4종만** 등록 (cicd.md 섹션 4 Step 4 참고)
  - `VITE_GOLD_API_KEY`, `VITE_EXCHANGE_API_KEY`, `VITE_ALPHA_VANTAGE_KEY`, `VITE_FRED_API_KEY`
- [ ] Branch Protection Rules 설정 (cicd.md 섹션 4 Step 5 참고)
- [ ] feature 브랜치에서 PR 생성 → CI Actions 전체 통과 확인
- [ ] Vercel 프리뷰 URL이 PR 코멘트에 자동 등록되는지 확인

---

### [ ] 5-7. 최종 빌드 검증 체크리스트

```bash
npm run build    # 빌드 성공
npm run preview  # 로컬 프리뷰 확인
npm run test     # 전체 테스트 통과
```

| 항목 | 확인 |
|------|------|
| TypeScript 에러 0건 | [ ] |
| ESLint 에러 0건 | [ ] |
| 전체 테스트 통과 | [ ] |
| 초기 JS 번들 500KB 이하 | [ ] |
| 모바일(375px) 레이아웃 정상 | [ ] |
| 데스크톱(1440px) 레이아웃 정상 | [ ] |
| 계산기 환산 정확도 검증 | [ ] |
| 면책 문구 표시 확인 | [ ] |
| `.env` gitignore 동작 확인 | [ ] |
| Vercel 프로덕션 배포 정상 | [ ] |

---

## Sprint 05 완료 기준

- [ ] 모바일/데스크톱 전 구역 레이아웃 깨짐 없음
- [ ] 6가지 에러 시나리오 모두 정상 처리
- [ ] 접근성: 등락 아이콘+색상 병행, aria-label 적용
- [ ] 초기 JS 번들 500KB 이하
- [ ] Vercel 프로덕션 배포 완료 및 URL 확인
- [ ] GitHub Actions CI (lint/type-check/test/build) 모두 통과
- [ ] main 머지 시 Vercel 자동 배포 동작 확인
- [ ] Branch Protection Rules 적용 (main 직접 push 차단)

### 테스트 완료 기준 (testing.md 참고)
- [ ] **UT-04** `format.test.ts` — formatKRW, formatChangeRate, getChangeColor, getChangeIcon (커버리지 100%)
- [ ] **FT-04** `errorScenarios.test.tsx` — A~D 에러 시나리오 전부 통과
- [ ] **FT-05** `accessibility.test.tsx` — aria-label, role=img, 키보드 탐색, aria-live 통과
- [ ] 전체 테스트 `npm run test` 통과 (실패 0건)
- [ ] 커버리지 `npm run test -- --coverage` 목표치 달성:
  - `utils/goldCalc.ts` 100%, `utils/forecast.ts` 95%, 전체 평균 80%
