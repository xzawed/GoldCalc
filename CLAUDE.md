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
- 컴포넌트에서 직접 `fetch()` 또는 `useEffect` API 호출 — TanStack Query 훅만 사용
- 컴포넌트에서 직접 금/은 가격 계산 — `src/utils/metalCalc.ts` 순수 함수만 사용
- `VITE_*` 접두사로 API 키 노출 — 모든 외부 API 호출은 `server.js` 프록시 경유
- D3, Chart.js 직접 사용 — Recharts `ComposedChart`만 사용
- `Disclaimer.tsx` 조건부 렌더링 또는 숨김 — 항상 표시 필수
- `.env` 파일 커밋

### 필수 준수
- 원화 표시: `Math.round()` + `toLocaleString('ko-KR')` → `₩1,234,567`
- 등락 색상: 상승 `#ef4444`(빨강▲), 하락 `#3b82f6`(파랑▼) — 한국 증시 관례
- 색상 단독 구분 금지 — 아이콘(▲▼) + `aria-label` 병행 필수
- 모든 테스트 가능 컴포넌트에 `data-testid` 필수
- API 테스트는 MSW 모킹 사용 — 실제 API 호출 금지
- 예측 차트: 과거 실선, 예측 점선(`strokeDasharray="5 5"`), 신뢰구간 `fillOpacity: 0.15`

---

## 실행 명령

```bash
npm run dev           # 개발 서버 (localhost:5173)
npm run build         # 프로덕션 빌드
npm test              # 전체 테스트
npm run test:coverage # 커버리지 리포트
npm run lint          # ESLint
npm run type-check    # TypeScript 검사
```

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
