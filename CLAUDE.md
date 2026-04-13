# GoldCalc — 귀금속 시세 계산기

국제 금/은시세(USD/troy oz) 및 국내 금시세(KRX)를 실시간 환율로 원화 환산.
g·돈·냥 단위 입력 → 원화 가격 즉시 계산. React SPA, Railway 배포.

---

## 기술 스택

| 역할 | 기술 | 버전 |
|------|------|------|
| UI 프레임워크 | React | 18 |
| 언어 | TypeScript | 5 |
| 빌드 도구 | Vite | 6 |
| 스타일링 | Tailwind CSS | 3 |
| UI 컴포넌트 | shadcn/ui | CLI 설치 |
| API 캐싱 | TanStack Query | 5 |
| 차트 | Recharts | 2 |
| 날짜 처리 | date-fns | 3 |
| 테스트 | Vitest + RTL + MSW | — |
| 배포 | Railway (Node.js 20) | — |

---

## 핵심 개발 규칙

### 절대 금지
- 컴포넌트에서 `useEffect`로 API 호출 — TanStack Query 훅만 사용 (`useEffect` 자체는 비API 로직에 허용)
- 컴포넌트에서 직접 금/은 가격 계산 — `src/utils/metalCalc.ts` 순수 함수만 사용
- `VITE_*` 접두사로 API 키 노출 — 모든 외부 API 호출은 `server.js` 프록시 경유
- D3, Chart.js 직접 사용 — Recharts `ComposedChart`만 사용
- `Disclaimer.tsx` 조건부 렌더링 또는 숨김 — 항상 표시 필수
- `.env` 파일 커밋
- 히스토리 기간 탭에 `PERIOD_OPTIONS` 직접 사용 — `getSupportedPeriodOptions(tabKey)` 경유 필수

### 필수 준수
- 원화 표시: `Math.round()` + `toLocaleString('ko-KR')` → `₩1,234,567`
- 등락 색상: 상승 `#ef4444`(빨강▲), 하락 `#3b82f6`(파랑▼) — 한국 증시 관례
- 색상 단독 구분 금지 — 아이콘(▲▼) + `aria-label` 병행 필수
- 모든 테스트 가능 컴포넌트에 `data-testid` 필수
- API 테스트는 MSW 모킹 사용 — 실제 API 호출 금지 (프록시 URL `*/api/*` 기준 인터셉트)
- 예측 차트: 과거 실선, 예측 점선(`strokeDasharray="5 5"`), 신뢰구간 `fillOpacity: 0.15`

---

## 실행 명령

```bash
npm run dev           # 프론트엔드 개발 서버 (localhost:5173)
npm run dev:server    # API 서버 단독 실행 (localhost:3000, --watch 자동 재시작)
npm run check         # 전체 품질 검증 (lint → type-check → test → build 순서)
npm run build         # 프로덕션 빌드
npm test              # 전체 테스트
npm run test:coverage # 커버리지 리포트
npm run lint          # ESLint
npm run type-check    # TypeScript 검사
```

---

## server.js 프록시 엔드포인트 추가 패턴

새 외부 API를 추가할 때 아래 패턴을 그대로 복사해 사용.

```js
// 1. CORS preflight
app.options('/api/<name>', (_req, res) => { setCorsHeaders(res); res.status(204).end() })

// 2. 실제 핸들러
app.get('/api/<name>', async (req, res) => {
  const apiKey = process.env.MY_API_KEY
  if (!apiKey) return res.status(503).json({ error: 'MY_API_KEY 미설정' })
  try {
    const response = await fetch(`https://external-api.com/endpoint`, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    })
    if (!response.ok) throw new Error(`외부API ${response.status}`)
    setCorsHeaders(res)
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=7200')
    return res.status(200).json(await response.json())
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' })
  }
})
```

MSW 핸들러도 함께 추가: `src/test/mocks/handlers.ts`에 `http.get('*/api/<name>', ...)` 추가 필수.

---

## 커밋 메시지 컨벤션

```
<type>: <한국어 요약>

- 세부 변경 항목 1
- 세부 변경 항목 2
```

| type | 용도 |
|------|------|
| `feat` | 새 기능 |
| `fix` | 버그 수정 |
| `refactor` | 동작 변화 없는 코드 개선 |
| `docs` | 문서만 변경 |
| `test` | 테스트 추가·수정 |
| `security` | 보안 관련 변경 |
| `chore` | 빌드·설정·의존성 |

**규칙:** 제목은 한국어, 명령형(`추가`, `수정`, `제거`), 50자 이내. Co-Author 태그 필수.

---

## 문서 인덱스

| 문서 | 언제 읽는가 |
|------|-----------|
| [docs/architecture.md](docs/architecture.md) | 컴포넌트 구조·데이터 흐름·파일 맵 파악 시 |
| [docs/api-contracts.md](docs/api-contracts.md) | API 엔드포인트·env vars·캐시 전략 확인 시 |
| [docs/domain-knowledge.md](docs/domain-knowledge.md) | 금/은 단위·공식·순도·시장 관례 확인 시 |
| [docs/testing.md](docs/testing.md) | 테스트 추가·MSW 패턴·testid 확인 시 |
| [docs/deployment.md](docs/deployment.md) | Railway·Supabase·CI/CD·env 설정 시 |
| [docs/decisions.md](docs/decisions.md) | 아키텍처 결정 이유 파악 시 |

---

## 개발 도구

- **SCAManager**: `git push` 시 자동 코드리뷰 → `http://scamanager-production.up.railway.app`
- 최초 설치: `bash .scamanager/install-hook.sh` (1회)

---

## Claude 자율 관리 권한

Claude는 업무 수행 효율과 정확성을 높이기 위해 다음 항목을 **자율적으로 등록·수정·삭제**할 수 있다.

### 스킬 (`.claude/skills/`)
- 프로젝트 전용 반복 작업을 스킬 파일로 추출하여 등록·수정·삭제
- 파일 위치: `.claude/skills/<skill-name>.md`
- 형식: frontmatter(`name`, `description`) + 마크다운 지시문
- **호출 방법:** `Read` 도구로 파일을 직접 읽고 지시문을 따른다 — `Skill` 도구는 superpowers 플러그인 스킬 전용이며 프로젝트 스킬을 자동 발견하지 않는다

### 에이전트
- 특정 작업에 최적화된 subagent 타입·프롬프트를 Agent 도구 호출 시 자율 결정
- 반복되는 에이전트 패턴은 스킬로 추출하여 재사용

### 훅 (`.claude/settings.json`)
- 도구 실행 전후 자동화가 필요한 경우 프로젝트 레벨 훅 추가·수정·삭제
- 이벤트: `PreToolUse`, `PostToolUse`, `Stop`, `Notification`
- 훅 변경 시 목적과 트리거를 주석 또는 커밋 메시지로 명시

### 원칙
- 관리 대상은 **프로젝트 레벨** (`.claude/`) 우선 — 사용자 전역(`~/.claude/settings.json`) 수정은 명시적 요청 시에만
- 스킬·훅 추가 후 목적을 사용자에게 간략히 보고
- 더 이상 불필요한 스킬·훅은 능동적으로 삭제하여 관리 부담 최소화
