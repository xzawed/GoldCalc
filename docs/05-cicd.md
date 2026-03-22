# GoldCalc — CI/CD 파이프라인 및 GitHub 연동

**작성일**: 2026-03-18
**핵심 원칙**: 모두 무료, 설정 최소화

---

## 1. 무료 플랜 한도 요약

| 서비스 | 무료 한도 | 본 프로젝트 예상 사용량 |
|--------|---------|-------------------|
| **GitHub** | 공개 저장소 무제한, Actions 2,000분/월 | 월 ~200분 (충분) |
| **Vercel Hobby** | 배포 무제한, 대역폭 100GB/월, 환경변수 무제한 | 월 ~1GB (충분) |

> 외부 API(시세/환율/보조지표)는 제공사 무료 플랜 기준으로만 운영되며, 요청 주기/캐싱(staleTime, refetchInterval 등)은 문서 PRD 요구사항을 우선으로 적용해 **과금 방지**를 목표로 한다.

> Vercel Hobby 플랜은 **비상업적 개인 프로젝트**에 무료. 상업적 사용 시 Pro 플랜 필요.
> 상업 목적이라면 **Cloudflare Pages** (무제한 대역폭, 상업용 무료) 대안 섹션 참고.

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
    │   │  Vercel 자동 프리뷰 배포     │  ← Vercel이 자동 처리
    │   │  PR 코멘트에 URL 등록        │    (GitHub Actions 불필요)
    │   └─────────────────────────────┘
    │                 │
    │         PR 리뷰 & 머지
    │                 │
    └─────────────────┼──── main 브랜치
                      ▼
        ┌─────────────────────────────┐
        │  Vercel 자동 프로덕션 배포   │  ← Vercel이 자동 처리
        │  https://goldcalc.vercel.app │    (deploy.yml 불필요)
        └─────────────────────────────┘
```

**핵심 구조**: GitHub Actions는 **CI(검증)만** 담당, 배포는 **Vercel이 GitHub를 직접 감시**하여 자동 처리.
`deploy.yml`·`preview.yml`·Vercel 토큰 불필요.

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

### Step 2 — Vercel 프로젝트 생성 및 GitHub 연동

1. [vercel.com](https://vercel.com) 접속 → GitHub 계정으로 로그인
2. **Add New Project** 클릭
3. GitHub 저장소 `goldcalc` 선택 → **Import**
4. 프레임워크: **Vite** 자동 감지됨
5. **Environment Variables** 탭에서 아래 4개 등록:

| 변수명 | 값 |
|--------|-----|
| `VITE_GOLD_API_KEY` | GoldAPI.io 키 |
| `VITE_EXCHANGE_API_KEY` | ExchangeRate-API 키 |
| `VITE_ALPHA_VANTAGE_KEY` | Alpha Vantage 키 (선택) |
| `VITE_FRED_API_KEY` | FRED API 키 (선택) |

6. **Deploy** 클릭 → 첫 배포 완료

이후부터:
- `main` 브랜치에 push → Vercel이 자동으로 프로덕션 배포
- PR 생성 → Vercel이 자동으로 프리뷰 URL 생성 후 PR에 코멘트 등록

**별도 설정 없이 무료로 자동 배포 완성.**

### Step 3 — .gitignore 필수 항목

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

### Step 4 — GitHub Secrets 등록 (CI용 API 키만)

GitHub 저장소 → **Settings → Secrets and variables → Actions → New repository secret**

> 테스트는 MSW 모킹을 사용하므로 실제 API 키 불필요.
> 빌드 검증 시에만 사용.

| Secret 이름 | 값 | 필수 여부 |
|------------|-----|---------|
| `VITE_GOLD_API_KEY` | GoldAPI.io 키 | 필수 |
| `VITE_EXCHANGE_API_KEY` | ExchangeRate-API 키 | 필수 |
| `VITE_ALPHA_VANTAGE_KEY` | Alpha Vantage 키 | 선택 |
| `VITE_FRED_API_KEY` | FRED API 키 | 선택 |

Vercel 토큰/ID는 **등록 불필요** — Vercel 대시보드 연동으로 대체.

### Step 5 — Branch Protection Rules 설정

GitHub 저장소 → **Settings → Branches → Add rule**
Branch name pattern: `main`

- [x] Require a pull request before merging
- [x] Require status checks to pass before merging
  - 필수 status check 추가: `CI / lint`, `CI / type-check`, `CI / test`, `CI / build`
- [x] Require branches to be up to date before merging
- [x] Do not allow bypassing the above settings

### Step 6 — Vercel SPA 라우팅 설정

React SPA는 클라이언트 사이드 라우팅을 위해 404를 index.html로 fallback해야 함.

프로젝트 루트에 `vercel.json` 생성:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

---

## 5. GitHub Actions CI 워크플로우

배포는 Vercel이 처리하므로 Actions는 **검증(CI)만** 담당.
`deploy.yml`·`preview.yml` 파일은 **생성하지 않음**.

### `.github/workflows/ci.yml`

```yaml
name: CI

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

# PR이 여러 번 push될 때 이전 실행 자동 취소
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  lint:
    name: lint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - run: npm ci
      - run: npm run lint

  type-check:
    name: type-check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - run: npm ci
      - run: npx tsc --noEmit

  test:
    name: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - run: npm ci

      - name: Run tests with coverage
        run: npm run test:coverage
        env:
          # 테스트는 MSW 모킹 사용 — 더미 값으로 충분
          VITE_GOLD_API_KEY: 'test-key'
          VITE_EXCHANGE_API_KEY: 'test-key'
          VITE_ALPHA_VANTAGE_KEY: 'test-key'
          VITE_FRED_API_KEY: 'test-key'

      - name: Upload coverage report
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: coverage-report
          path: coverage/
          retention-days: 7

  build:
    name: build
    runs-on: ubuntu-latest
    needs: [lint, type-check]
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - run: npm ci

      - name: Build
        run: npm run build
        env:
          VITE_GOLD_API_KEY: ${{ secrets.VITE_GOLD_API_KEY }}
          VITE_EXCHANGE_API_KEY: ${{ secrets.VITE_EXCHANGE_API_KEY }}
          VITE_ALPHA_VANTAGE_KEY: ${{ secrets.VITE_ALPHA_VANTAGE_KEY }}
          VITE_FRED_API_KEY: ${{ secrets.VITE_FRED_API_KEY }}

      - name: Check bundle size
        run: |
          SIZE_KB=$(du -sk dist/assets/ | cut -f1)
          echo "번들 크기: ${SIZE_KB}KB"
          if [ "$SIZE_KB" -gt 500 ]; then
            echo "❌ 번들 500KB 초과: ${SIZE_KB}KB"
            exit 1
          fi
          echo "✅ 번들 크기 통과: ${SIZE_KB}KB"

      - uses: actions/upload-artifact@v4
        with:
          name: dist
          path: dist/
          retention-days: 1
```

---

## 6. package.json 스크립트

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint src --ext .ts,.tsx --report-unused-disable-directives --max-warnings 0",
    "lint:fix": "eslint src --ext .ts,.tsx --fix",
    "type-check": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:ui": "vitest --ui"
  }
}
```

---

## 7. ESLint 설정 (`.eslintrc.cjs`)

```js
module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh'],
  rules: {
    'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': 'error',
    'no-console': ['warn', { allow: ['warn', 'error'] }],
  },
};
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
git add src/ vercel.json
git commit -m "feat: 실시간 계산기 컴포넌트 구현"
git push origin feature/sprint-02-calculator

# 4. GitHub에서 PR 생성
# → GitHub Actions CI 자동 실행 (lint → type-check → test → build)
# → Vercel이 자동으로 프리뷰 URL 생성 후 PR 코멘트에 등록
#    예) https://goldcalc-git-feature-sprint02-username.vercel.app

# 5. CI 통과 + 리뷰 후 PR 머지
# → Vercel이 자동으로 프로덕션 배포
#    예) https://goldcalc.vercel.app
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
| `build` | 번들 500KB 초과 | `import` 최적화, lazy loading 추가 |
| Vercel 배포 | 환경변수 누락 | Vercel 대시보드 → Settings → Environment Variables 확인 |
| Vercel 배포 | 빌드 실패 | Vercel 대시보드 → Deployments → 로그 확인 |

---

## 12. 대안 — Cloudflare Pages (상업적 사용 또는 대용량 트래픽)

Vercel Hobby는 비상업적 용도 무료. 상업용이거나 트래픽이 많다면 **Cloudflare Pages** 권장.

| 항목 | Vercel Hobby | Cloudflare Pages |
|------|-------------|-----------------|
| 가격 | 무료 (비상업) | **완전 무료** (상업 포함) |
| 대역폭 | 100GB/월 | **무제한** |
| 빌드 횟수 | 무제한 | 500회/월 |
| PR 프리뷰 | 자동 | 자동 |
| GitHub 연동 | 자동 | 자동 |
| 배포 속도 | 빠름 | 매우 빠름 (전 세계 CDN) |
| 커스텀 도메인 | 무료 | 무료 |

### Cloudflare Pages 전환 방법

1. [pages.cloudflare.com](https://pages.cloudflare.com) → GitHub 계정 연결
2. **Create a project** → GitHub 저장소 선택
3. Build settings:
   - Framework preset: **Vite**
   - Build command: `npm run build`
   - Build output directory: `dist`
4. Environment variables 등록 (Vercel과 동일한 4개)
5. **Save and Deploy**

`vercel.json` 대신 `_redirects` 파일을 `public/` 폴더에 생성 (SPA 라우팅):
```
/* /index.html 200
```

GitHub Actions `ci.yml`은 **변경 없이 그대로 사용 가능**.
