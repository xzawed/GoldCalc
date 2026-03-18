# GoldCalc — 국제 금시세 원화 환산 계산기

국제 금시세(USD/troy oz)를 실시간 환율로 원화(KRW)로 환산하여,
g(그램) / 돈 / 냥 단위로 입력하면 현재 원화 가격을 즉시 계산해주는 웹 앱입니다.

[![CI](https://github.com/xzawed/GoldCalc/actions/workflows/ci.yml/badge.svg)](https://github.com/xzawed/GoldCalc/actions/workflows/ci.yml)

---

## 주요 기능

| 구역 | 기능 |
|------|------|
| **1구역 — 계산기** | 실시간 금시세 + 환율 조회, g/돈/냥 단위 입력, 24K/18K/14K 순도 선택, 원화 즉시 환산 |
| **2구역 — 시세 변동** | 1주/1개월/3개월/1년 히스토리 차트 (이중 Y축), 날짜별 등락 테이블, 최고·최저·평균 배지 |
| **3구역 — 예측** | MA5/MA20 + 선형 회귀 기반 7일/30일 예측 차트, 신뢰 구간, 시장 신호 (DXY · 국채 · VIX) |

---

## 기술 스택

| 역할 | 기술 |
|------|------|
| UI 프레임워크 | React 18 |
| 언어 | TypeScript 5 |
| 빌드 | Vite 6 |
| 스타일링 | Tailwind CSS v3 + shadcn/ui |
| API 캐싱 | TanStack Query v5 |
| 차트 | Recharts v2 |
| 테스트 | Vitest v2 + React Testing Library + MSW v2 |
| 배포 | Vercel (GitHub 연동 자동 배포) |

---

## 도메인 지식

### 무게 단위 변환

| 단위 | 기준 |
|------|------|
| 1 트로이 온스 (troy oz) | 31.1035 g |
| 1 돈 | 3.75 g |
| 1 냥 | 37.5 g (= 10돈) |

### 환산 공식

```
금 1g 원화 가격 = (국제 금시세 USD/oz ÷ 31.1035) × USD/KRW 환율
금 1돈 원화 가격 = 금 1g 원화 가격 × 3.75
```

### 순도 계수

| 순도 | 계수 |
|------|------|
| 24K | 0.9999 |
| 18K | 0.75 |
| 14K | 0.583 |

---

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경변수 설정

`.env.example`을 복사해 `.env` 파일을 만들고 API 키를 입력합니다.

```bash
cp .env.example .env
```

```env
VITE_GOLD_API_KEY=your_key          # GoldAPI.io 키
VITE_GOLD_API_URL=https://www.goldapi.io/api

VITE_EXCHANGE_RATE_API_KEY=your_key # ExchangeRate-API v6 키
VITE_EXCHANGE_RATE_API_URL=https://v6.exchangerate-api.com/v6

VITE_ALPHA_VANTAGE_KEY=             # (선택) 시장 신호용
VITE_FRED_API_KEY=                  # (선택) 국채 금리용
```

> **API 키 발급**
> - 금시세: [GoldAPI.io](https://www.goldapi.io/) (무료 플랜 제공)
> - 환율: [ExchangeRate-API](https://www.exchangerate-api.com/) (무료 플랜 제공)

### 3. 개발 서버 실행

```bash
npm run dev        # localhost:5173
```

---

## 스크립트

```bash
npm run dev            # 개발 서버
npm run build          # 프로덕션 빌드
npm run preview        # 빌드 결과 미리보기
npm run lint           # ESLint 검사
npm run type-check     # TypeScript 타입 검사
npm run test           # 전체 테스트
npm run test:coverage  # 커버리지 포함 테스트
```

---

## 프로젝트 구조

```
src/
├── components/
│   ├── layout/          # Header, PriceBar, Footer, OfflineBanner
│   ├── common/          # ErrorAlert
│   ├── calculator/      # 1구역 — 계산기 (Sprint 02)
│   ├── history/         # 2구역 — 시세 변동 (Sprint 03)
│   └── forecast/        # 3구역 — 예측 (Sprint 04)
├── hooks/               # TanStack Query 기반 데이터 훅
├── utils/               # 순수 함수 (계산·포맷·예측 알고리즘)
├── types/               # 공유 TypeScript 타입
└── test/                # MSW 서버·핸들러·픽스처·커스텀 렌더
```

---

## 개발 규칙 요약

- **API 호출**: TanStack Query `useQuery` 훅으로만 처리 — 컴포넌트 내 직접 fetch 금지
- **계산 로직**: `utils/goldCalc.ts` 순수 함수로 분리
- **등락 색상**: 한국 증시 관례 — 상승 `#ef4444`(빨강 ▲), 하락 `#3b82f6`(파랑 ▼)
- **면책 문구**: `Disclaimer` 컴포넌트는 항상 렌더링 — 조건부/숨김 처리 절대 금지
- **원화 표시**: `₩146,500` 형식 (`formatKRW` 함수 사용)

---

## CI/CD

- **CI**: GitHub Actions — `feature/**` 브랜치 push 및 `main` PR 시 자동으로 lint → type-check → test → build 실행
- **배포**: Vercel × GitHub 네이티브 연동 — `main` 푸시 시 자동 프로덕션 배포, PR 생성 시 미리보기 URL 자동 생성

---

## 관련 문서

| 문서 | 내용 |
|------|------|
| `CLAUDE.md` | 프로젝트 전체 개요 및 개발 규칙 |
| `prd.md` | 제품 요구사항 명세 |
| `techstack.md` | 기술 스택 선정 근거 |
| `skills.md` | 구현 패턴 및 코드 예시 |
| `testing.md` | 테스트 전략 및 케이스 명세 |
| `cicd.md` | CI/CD 파이프라인 설정 가이드 |
| `sprint-01~05.md` | Sprint별 구현 체크리스트 |

---

## 라이선스

MIT
