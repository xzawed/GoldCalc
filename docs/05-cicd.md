# GoldCalc — CI/CD 파이프라인 및 GitHub 연동

**작성일**: 2026-03-23
**핵심 원칙**: 모두 무료, 설정 최소화

---

## 1. 무료 플랜 한도 요약

| 서비스 | 무료 한도 | 본 프로젝트 예상 사용량 |
|--------|---------|-------------------|
| **GitHub** | 공개 저장소 무제한, Actions 2,000분/월 | 월 ~200분 (충분) |
| **Railway Hobby** | $5 크레딧/월 무료 제공, 메모리 512MB | 저트래픽 프로젝트에 충분 |

> 외부 API(시세/환율/보조지표)는 제공사 무료 플랜 기준으로만 운영되며, 요청 주기/캐싱(staleTime, refetchInterval 등)을 적용해 **과금 방지**를 목표로 한다.

---

## 2. 전체 파이프라인 구조

```
개발자 로컬
    │
    ├── feature/* 브랜치 push
    │         │
    │         ▼ PR 생성
    │   ┌─────────────────────────────┐
    │   │    GitHub Actions (ci.yml)   │  ← 검증만 담당
    │   │                             │
    │   │  lint → type-check → test   │
    │   │        → build 검증         │
    │   └─────────────┬───────────────┘
    │                 │ 통과
    │                 ▼
    │   ┌─────────────────────────────┐
    │   │  Railway PR Environment     │  ← Railway가 자동 처리
    │   │  PR마다 프리뷰 URL 생성      │    (대시보드에서 활성화 필요)
    │   └─────────────────────────────┘
    │                 │
    │         PR 리뷰 & 머지
    │                 │
    └─────────────────┼──── main 브랜치
                      ▼
        ┌─────────────────────────────────────┐
        │  Railway 자동 프로덕션 배포           │  ← Railway가 자동 처리
        │  https://goldcalc-production.up.railway.app    │
        └─────────────────────────────────────┘
```

**핵심 구조**: GitHub Actions는 **CI(검증)만** 담당, 배포는 **Railway가 GitHub를 직접 감시**하여 자동 처리.

---

## 3. 브랜치 전략 (GitHub Flow)

```
main ──────────────────────────────────────────► 프로덕션 자동 배포
  │
  ├── feature/sprint-01-setup
  ├── feature/sprint-02-calculator
  ├── feature/sprint-03-history
  ├── feature/sprint-04-forecast
  └── feature/sprint-05-polish
         └── PR → CI 통과 → main 머지 → 자동 배포
```

| 브랜치 | 용도 | 보호 규칙 |
|--------|------|----------|
| `main` | 프로덕션 배포 소스 | PR + CI 통과 필수, 직접 push 금지 |
| `feature/*` | 기능 개발 | 자유롭게 push |

---

## 4. 초기 설정 순서

### Step 1 — GitHub 저장소 생성

```bash
git init
git add .
git commit -m "chore: initial project setup"

# GitHub에서 저장소 생성 후 (github.com/new)
git remote add origin https://github.com/{username}/goldcalc.git
git branch -M main
git push -u origin main
```

### Step 2 — Railway 프로젝트 생성 및 GitHub 연동

1. [railway.app](https://railway.app) 접속 → GitHub 계정으로 로그인
2. **New Project** 클릭 → **Deploy from GitHub repo** 선택
3. GitHub 저장소 `goldcalc` 선택 → **Deploy Now**
4. Railway가 `railway.json`을 감지하여 자동으로 빌드/배포 설정 적용
5. **Settings → Variables** 탭에서 아래 환경변수 등록:

| 변수명 | 값 |
|--------|-----|
| `VITE_GOLD_API_KEY` | GoldAPI.io 키 |
| `VITE_GOLD_API_URL` | `https://www.goldapi.io/api` |
| `VITE_EXCHANGE_RATE_API_KEY` | ExchangeRate-API 키 |
| `VITE_EXCHANGE_RATE_API_URL` | `https://v6.exchangerate-api.com/v6` |
| `VITE_ALPHA_VANTAGE_KEY` | Alpha Vantage 키 (선택) |
| `VITE_FRED_API_KEY` | FRED API 키 (선택) |
| `DATA_GO_KR_API_KEY` | 공공데이터포털 serviceKey |

6. **Deploy** 완료 후 Settings → Domains에서 자동 생성된 URL 확인

이후부터:
- `main` 브랜치에 push → Railway가 자동으로 프로덕션 배포
- PR 생성 → Railway PR Environments(아래 Step 3) 활성화 시 프리뷰 URL 자동 생성

**별도 설정 없이 무료로 자동 배포 완성.**

### Step 3 — Railway PR Environments 활성화 (선택)

PR 프리뷰 배포가 필요한 경우:

1. Railway 프로젝트 → **Settings → Environments**
2. **Enable PR Environments** 토글 활성화
3. 이후 PR 생성 시 Railway가 임시 환경을 자동 생성하고 URL을 PR 코멘트에 등록

### Step 4 — .gitignore 필수 항목

```gitignore
# 환경변수 (절대 커밋 금지)
.env
.env.local
.env.production

# 빌드 결과물
dist/
dist-ssr/

# 테스트 커버리지
coverage/

# 의존성
node_modules/

# 에디터
.vscode/settings.json
.idea/

# OS
.DS_Store
Thumbs.db
```

### Step 5 — Branch Protection Rules 설정

GitHub 저장소 → **Settings → Branches → Add rule**
Branch name pattern: `main`

- [x] Require a pull request before merging
- [x] Require status checks to pass before merging
  - 필수 status check 추가: `CI / Lint · Type-check · Test · Build`
- [x] Require branches to be up to date before merging
- [x] Do not allow bypassing the above settings

---

## 5. GitHub Actions CI 워크플로우

배포는 Railway가 처리하므로 Actions는 **검증(CI)만** 담당.

### `.github/workflows/ci.yml`

```yaml
name: CI

on:
  push:
    branches: [main, 'feature/**']
  pull_request:
    branches: [main]

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  ci:
    name: Lint · Type-check · Test · Build
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v5

      - uses: actions/setup-node@v5
        with:
          node-version: '22'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Type-check
        run: npm run type-check

      - name: Test
        run: npm run test:coverage
        env:
          # 테스트는 MSW 모킹 사용 — 더미 값으로 충분
          VITE_GOLD_API_KEY: test-key
          VITE_GOLD_API_URL: https://www.goldapi.io/api
          VITE_EXCHANGE_RATE_API_KEY: test-key
          VITE_EXCHANGE_RATE_API_URL: https://v6.exchangerate-api.com/v6
          VITE_ALPHA_VANTAGE_KEY: test-key
          VITE_FRED_API_KEY: test-key

      - name: Upload coverage
        uses: actions/upload-artifact@v5
        if: always()
        with:
          name: coverage-report
          path: coverage/
          retention-days: 7

      - name: Build
        run: npm run build
        env:
          VITE_GOLD_API_KEY: test-key
          VITE_GOLD_API_URL: https://www.goldapi.io/api
          VITE_EXCHANGE_RATE_API_KEY: test-key
          VITE_EXCHANGE_RATE_API_URL: https://v6.exchangerate-api.com/v6
          VITE_ALPHA_VANTAGE_KEY: test-key
          VITE_FRED_API_KEY: test-key

# Railway 배포는 GitHub 레포 연동으로 자동 처리됨
# - main push → Railway 프로덕션 자동 배포
# - PR 생성 → Railway PR Environment 자동 생성 (대시보드에서 활성화 필요)
```

---

## 6. Railway 배포 설정 (`railway.json`)

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm run build"
  },
  "deploy": {
    "startCommand": "node server.js",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

Railway는 Nixpacks로 Node.js를 자동 감지하고:
1. `npm run build` 실행 → `dist/` 생성
2. `node server.js` 실행 → Express 서버 기동

### SPA 서빙 + API 프록시 구조 (`server.js`)

```
클라이언트 요청
    ├── GET /api/domestic-gold  → data.go.kr 프록시 처리
    ├── GET /static/*           → dist/ 정적 파일 서빙
    └── GET /*                  → dist/index.html 폴백 (SPA 라우팅)
```

---

## 7. package.json 스크립트

```json
{
  "scripts": {
    "dev": "vite",
    "build": "npx tsc && vite build",
    "preview": "vite preview",
    "start": "node server.js",
    "lint": "eslint src --ext .ts,.tsx --report-unused-disable-directives --max-warnings 0",
    "lint:fix": "eslint src --ext .ts,.tsx --fix",
    "type-check": "npx tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:ui": "vitest --ui"
  }
}
```

---

## 8. PR 템플릿 (`.github/pull_request_template.md`)

```markdown
## 변경 내용

<!-- 변경 사항을 간략히 서술 -->

## 체크리스트

- [ ] 관련 Sprint 체크리스트 완료 (sprint-0X.md 참고)
- [ ] `npm run lint` 통과
- [ ] `npm run type-check` 통과
- [ ] `npm run test` 통과
- [ ] 새로 추가된 유틸 함수에 단위 테스트 작성
- [ ] 새로 추가된 컴포넌트에 `data-testid` 속성 추가
- [ ] `.env`에 새 환경변수 추가 시 `.env.example` 업데이트

## 스크린샷 (UI 변경 시)

| Before | After |
|--------|-------|
|        |       |
```

---

## 9. Sprint별 브랜치 및 PR 흐름

| Sprint | 브랜치명 | PR 제목 예시 |
|--------|---------|------------|
| Sprint 01 | `feature/sprint-01-setup` | `feat: 프로젝트 초기 설정 및 테스트 인프라 구축` |
| Sprint 02 | `feature/sprint-02-calculator` | `feat: 실시간 계산기 구현 (1구역)` |
| Sprint 03 | `feature/sprint-03-history` | `feat: 날짜별 시세 변동 내역 구현 (2구역)` |
| Sprint 04 | `feature/sprint-04-forecast` | `feat: 금시세 예측 구현 (3구역)` |
| Sprint 05 | `feature/sprint-05-polish` | `feat: 반응형·접근성·성능 개선 및 배포` |

---

## 10. 로컬 개발 → 자동 배포 전체 흐름

```bash
# 1. 브랜치 생성
git checkout -b feature/sprint-02-calculator

# 2. 개발 후 로컬 검증
npm run lint
npm run type-check
npm run test
npm run build

# 3. 커밋 & 푸시
git add src/ server.js railway.json
git commit -m "feat: 실시간 계산기 컴포넌트 구현"
git push origin feature/sprint-02-calculator

# 4. GitHub에서 PR 생성
# → GitHub Actions CI 자동 실행 (lint → type-check → test → build)
# → Railway PR Environment 활성화 시 프리뷰 URL 자동 생성

# 5. CI 통과 + 리뷰 후 PR 머지
# → Railway가 자동으로 프로덕션 배포
#    https://goldcalc-production.up.railway.app
```

---

## 11. CI 실패 대응 가이드

| 실패 단계 | 원인 | 해결 방법 |
|----------|------|----------|
| `lint` | ESLint 오류 | `npm run lint:fix` 후 재커밋 |
| `type-check` | TypeScript 타입 오류 | 오류 메시지 확인 후 타입 수정 |
| `test` | 테스트 실패 | 실패 케이스 로컬 재현 후 수정 |
| `test` | 커버리지 미달 | 누락된 테스트 케이스 추가 |
| `build` | 빌드 에러 | 로컬 `npm run build` 재현 후 수정 |
| Railway 배포 | 환경변수 누락 | Railway 대시보드 → Settings → Variables 확인 |
| Railway 배포 | 빌드 실패 | Railway 대시보드 → Deployments → 로그 확인 |
| Railway 배포 | 서버 크래시 | Railway 대시보드 → Deployments → 런타임 로그 확인 |
