# GoldCalc — 기술 스택 검토

**작성일**: 2026-03-18

---

## 1. 선정 기준

| 기준 | 설명 |
|------|------|
| 생산성 | 빠른 개발 속도, 풍부한 생태계 |
| 번들 크기 | 초기 로드 500KB 이하 목표 |
| 유지보수성 | 타입 안전성, 명확한 구조 |
| 실시간 데이터 | API 캐싱·갱신 처리 용이성 |
| 차트 품질 | 이중 Y축, 신뢰 구간, 반응형 지원 |

---

## 2. 최종 기술 스택

### 2.1 코어 프레임워크

| 항목 | 선택 | 버전 | 이유 |
|------|------|------|------|
| UI 프레임워크 | **React** | 18 | 커뮤니티 최대, 훅 기반 상태 관리 |
| 언어 | **TypeScript** | 5 | 타입 안전성, API 응답 타이핑 필수 |
| 빌드 도구 | **Vite** | 5 | HMR 속도, 간단한 설정, ESM 네이티브 |

> Next.js는 SSR/SEO가 필요한 경우 적합하나, 본 프로젝트는 실시간 데이터 계산기 특성상 CSR SPA로 충분.

---

### 2.2 스타일링

| 항목 | 선택 | 대안 | 선택 이유 |
|------|------|------|----------|
| CSS 프레임워크 | **Tailwind CSS v3** | MUI, Chakra UI | 번들 크기 최소, 유틸리티 클래스로 빠른 개발 |
| 컴포넌트 라이브러리 | **shadcn/ui** | Radix UI 단독 | Tailwind 기반, 복사형 컴포넌트로 커스터마이징 자유도 최고 |

**shadcn/ui 사용 컴포넌트 목록**
- `Tabs` — 단위 선택(g/돈/냥), 기간 탭(1주/1개월)
- `Card` — 계산기, 요약 배지, 시장 신호 카드
- `Badge` — 최고가/최저가/평균가, 등락률 표시
- `Select` — 순도 선택(24K/18K/14K), 예측 기간
- `Skeleton` — API 로딩 중 스켈레톤 UI
- `Alert` — 에러 메시지, 면책 문구

---

### 2.3 API 데이터 페칭 및 캐싱

| 항목 | 선택 | 대안 | 선택 이유 |
|------|------|------|----------|
| 서버 상태 관리 | **TanStack Query v5** | SWR, 직접 useEffect | 캐싱·자동 갱신·에러 재시도·staleTime 설정이 내장 |

**TanStack Query 적용 포인트**

```ts
// 현재 금시세 — 5분 캐시, 5분마다 자동 갱신
useQuery({
  queryKey: ['goldPrice'],
  queryFn: fetchGoldPrice,
  staleTime: 5 * 60 * 1000,
  refetchInterval: 5 * 60 * 1000,
})

// 히스토리 — 24시간 캐시 (하루에 한 번만 변경)
useQuery({
  queryKey: ['goldHistory', period],
  queryFn: () => fetchGoldHistory(period),
  staleTime: 24 * 60 * 60 * 1000,
})
```

> `useEffect` + `fetch` 직접 구현 대비: 로딩/에러 상태, 중복 요청 방지, 백그라운드 갱신을 자동 처리하므로 코드량 40% 이상 절감.

---

### 2.4 차트

| 항목 | 선택 | 대안 | 선택 이유 |
|------|------|------|----------|
| 차트 라이브러리 | **Recharts v2** | Chart.js, Nivo, Victory | React 네이티브 컴포넌트, 이중 Y축·ComposedChart 지원, 번들 크기 적절 |

**Recharts 선택 근거 상세**

| 기능 | Recharts | Chart.js | Nivo |
|------|----------|----------|------|
| 이중 Y축 | ✅ 기본 지원 | ✅ | ✅ |
| 신뢰 구간 영역 | ✅ Area 컴포넌트 | 제한적 | ✅ |
| 실선+점선 혼합 | ✅ strokeDasharray | ✅ | ✅ |
| React 컴포넌트 방식 | ✅ | ❌ (명령형) | ✅ |
| 번들 크기 | ~150KB | ~200KB | ~500KB |
| 반응형 | ✅ ResponsiveContainer | 수동 처리 | ✅ |

---

### 2.5 날짜 처리

| 항목 | 선택 | 대안 | 선택 이유 |
|------|------|------|----------|
| 날짜 라이브러리 | **date-fns v3** | dayjs, Luxon | 트리 셰이킹 완벽 지원, 필요한 함수만 import |

**사용 함수**
```ts
import { format, subDays, subMonths, subYears, eachDayOfInterval } from 'date-fns';
import { ko } from 'date-fns/locale';

format(new Date(), 'yyyy-MM-dd')           // API 날짜 포맷
format(new Date(), 'M월 d일', { locale: ko }) // 차트 X축 라벨
subDays(new Date(), 7)                     // 1주 전 날짜
eachDayOfInterval({ start, end })          // 히스토리 날짜 목록 생성
```

---

### 2.6 테스트

| 항목 | 선택 | 이유 |
|------|------|------|
| 테스트 프레임워크 | **Vitest** | Vite와 동일 설정 공유, Jest 호환 API |
| UI 테스트 | **React Testing Library** | 사용자 관점 테스트 |
| API 모킹 | **MSW (Mock Service Worker)** | 실제 fetch 인터셉트, 네트워크 레벨 모킹 |

**테스트 우선 대상**
- `utils/goldCalc.ts` — 환산 공식 정확도 단위 테스트
- `utils/forecast.ts` — 이동평균, 선형 회귀 알고리즘 단위 테스트
- `hooks/useGoldPrice` — MSW로 API 응답 모킹 후 훅 동작 검증

---

### 2.7 배포 및 CI/CD

| 항목 | 선택 | 이유 |
|------|------|------|
| 호스팅 | **Vercel Hobby** | 무료, Vite SPA 자동 인식, 환경변수 관리 UI, PR 프리뷰 자동 생성 |
| 자동 배포 | **Vercel × GitHub 네이티브 연동** | 대시보드에서 저장소 연결만으로 main push → 자동 배포, deploy.yml 불필요 |
| CI 검증 | **GitHub Actions** | PR 시 lint + type-check + test + build 자동 실행 (무료 2,000분/월) |
| 브랜치 전략 | **GitHub Flow** | main(배포) + feature/* 브랜치, PR → CI 통과 → main 머지 → 자동 배포 |
| 상업용 대안 | **Cloudflare Pages** | 무제한 대역폭, 상업 목적 무료, GitHub 연동 동일 방식 |

**배포 흐름 핵심**: GitHub Actions는 검증(CI)만, 배포는 Vercel이 GitHub를 직접 감시하여 자동 처리.
`deploy.yml`·`preview.yml` 파일 불필요 → Vercel 토큰/ID를 GitHub Secrets에 등록할 필요 없음.

---

## 3. 최종 패키지 목록

```json
{
  "dependencies": {
    "react": "^18",
    "react-dom": "^18",
    "recharts": "^2",
    "@tanstack/react-query": "^5",
    "date-fns": "^3",
    "clsx": "^2",
    "tailwind-merge": "^2"
  },
  "devDependencies": {
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "typescript": "^5",
    "vite": "^5",
    "@vitejs/plugin-react": "^4",
    "tailwindcss": "^3",
    "autoprefixer": "^10",
    "postcss": "^8",
    "vitest": "^1",
    "@testing-library/react": "^14",
    "@testing-library/user-event": "^14",
    "msw": "^2"
  }
}
```

> **shadcn/ui**는 패키지 설치가 아닌 CLI로 컴포넌트를 프로젝트에 직접 복사하는 방식이므로 별도 의존성 없음.

---

## 4. 아키텍처 다이어그램

```
┌─────────────────────────────────────────────────────┐
│                  React SPA (Vite)                   │
│                                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌────────────┐  │
│  │  calculator/ │  │  history/   │  │ forecast/  │  │
│  │  components  │  │  components │  │ components │  │
│  └──────┬──────┘  └──────┬──────┘  └─────┬──────┘  │
│         │                │               │          │
│  ┌──────▼──────────────────────────────────────┐   │
│  │           TanStack Query (캐시 레이어)        │   │
│  │  useGoldPrice │ useGoldHistory │ useForecast │   │
│  └──────┬───────────────┬────────────────┬─────┘   │
│         │               │                │          │
│  ┌──────▼───────┐  ┌────▼──────┐  ┌─────▼──────┐  │
│  │ utils/       │  │ Recharts  │  │ utils/     │  │
│  │ goldCalc.ts  │  │  Charts   │  │ forecast.ts│  │
│  └──────────────┘  └───────────┘  └────────────┘  │
└──────────────────────────┬──────────────────────────┘
                           │ HTTPS
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
   GoldAPI.io      ExchangeRate-API     FRED / Alpha
   (금시세)          (환율)             Vantage (지표)
```

---

## 5. 기술 스택 의사결정 요약

| 결정 | 선택 | 기각된 대안 | 기각 이유 |
|------|------|------------|----------|
| 프레임워크 | React SPA | Next.js | SSR 불필요, 복잡도 증가 |
| 서버 상태 | TanStack Query | 직접 useEffect | 보일러플레이트 과다, 캐싱 누락 위험 |
| 컴포넌트 | shadcn/ui | MUI | MUI는 번들 크기 크고 커스터마이징 어려움 |
| 차트 | Recharts | Nivo | Nivo는 번들 ~500KB로 과대, 학습 곡선 높음 |
| 날짜 | date-fns | dayjs | dayjs는 플러그인 방식으로 트리셰이킹 불리 |
| 테스트 | Vitest | Jest | Vite 환경에서 Jest는 별도 transform 설정 필요 |
| 배포 | Vercel | Netlify | Vite 최적화 템플릿, 환경변수 관리 UI 우수 |
