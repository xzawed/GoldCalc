# GoldCalc 문서 재편 설계

**날짜:** 2026-04-13  
**목적:** Claude가 작업 시 정확하고 오류 없이 읽을 수 있도록 문서 구조 최적화  
**원칙:** 현재 상태(as-is)만 기술, 테이블·목록·코드 블록 우선, 각 파일 200줄 이하

---

## 1. 목표 파일 구조

```
CLAUDE.md                     ← 인덱스 + 핵심 개발 규칙 (목표 150줄)
docs/
  architecture.md             ← 컴포넌트 맵, 데이터 흐름, 시스템 경계 (~200줄)
  api-contracts.md            ← 외부 API, 프록시 엔드포인트, 환경변수 (~220줄)
  domain-knowledge.md         ← 단위 변환, 순도 비율, 계산 공식, 시장 관례 (~100줄)
  testing.md                  ← 테스트 전략, MSW 패턴, testid 규칙, 커버리지 (~200줄)
  deployment.md               ← Railway·Supabase·CI/CD·env 설정 (~180줄)
  decisions.md                ← ADR 스타일 결정 기록 (~120줄)
  superpowers/specs/          ← 브레인스토밍 설계 명세 (이 파일 포함)
```

---

## 2. 기존 파일 처리 계획

| 기존 파일 | 줄 수 | 처리 방법 | 대상 파일 |
|---|---|---|---|
| `docs/01-prd.md` | 357 | 기능 명세 → 흡수 후 삭제 | `architecture.md` |
| `docs/02-techstack.md` | 221 | 선택 근거 → 흡수 후 삭제 | `decisions.md` |
| `docs/03-skills.md` | 456 | 삭제 (코드가 정답) | — |
| `docs/04-testing.md` | 1,250 | 압축 재작성 후 삭제 | `testing.md` |
| `docs/05-cicd.md` | 371 | 흡수 후 삭제 | `deployment.md` |
| `docs/06-sprint-01.md` | 115 | 삭제 (git log가 히스토리) | — |
| `docs/07-sprint-02.md` | 100 | 삭제 | — |
| `docs/08-sprint-03.md` | 88 | 삭제 | — |
| `docs/09-sprint-04.md` | 101 | 삭제 | — |
| `docs/10-sprint-05.md` | 125 | 삭제 | — |
| `docs/11-decisions.md` | 111 | 흡수 후 삭제 | `decisions.md` |
| `docs/12-api-key-guide.md` | 193 | 흡수 후 삭제 | `deployment.md` |
| `CLAUDE.md` | 373 | 슬림화 (인덱스 역할만) | `CLAUDE.md` |

---

## 3. 각 파일 명세

### CLAUDE.md (150줄 이하)
- **역할:** Claude가 세션 시작 시 반드시 읽는 단일 진입점
- **포함:** 프로젝트 한 줄 요약, 기술 스택 테이블, Do/Never 핵심 규칙, docs/ 인덱스
- **제거:** 도메인 지식(→ domain-knowledge.md), API 상세(→ api-contracts.md), 스프린트 히스토리

### docs/architecture.md (~200줄)
- **역할:** "이 시스템이 어떻게 생겼는가"에 답하는 파일
- **포함:**
  - 4구역 레이아웃 구조 (계산기/히스토리/예측/뉴스)
  - 컴포넌트 트리 — 파일 경로 포함
  - 데이터 흐름: 외부 API → 서버 프록시 → TanStack Query 훅 → 컴포넌트
  - 페일오버 아키텍처 (Railway → Supabase circuit breaker)
  - 자산 탭별 렌더링 분기 (국제금/은, 국내금/은)
- **포맷:** ASCII 다이어그램 + 파일경로 테이블

### docs/api-contracts.md (~220줄)
- **역할:** "이 API를 어떻게 호출하는가"에 답하는 파일
- **포함:**
  - 서버 프록시 엔드포인트 (method, path, params, response shape)
  - 외부 API 원본 (GoldAPI.io, ExchangeRate-API, gold-api.com, data.go.kr, FRED, Alpha Vantage)
  - 환경변수 전체 목록 (서버사이드 / 클라이언트사이드 구분)
  - 캐시 전략 (Cache-Control 헤더, TanStack staleTime)
- **포맷:** 엔드포인트별 코드 블록 + 파라미터 테이블

### docs/domain-knowledge.md (~100줄)
- **역할:** "금/은 계산 시 어떤 공식과 규칙을 따르는가"에 답하는 파일
- **포함:**
  - 무게 단위 변환 테이블 (g, 돈, 냥, 관, troy oz)
  - 금 순도 비율 테이블 (24K/18K/14K)
  - 은 순도 비율 테이블 (999/925/900/800)
  - 계산 공식 (원화 환산, 순도 적용)
  - 한국 시장 관례 (상승=빨강▲, 하락=파랑▼)
  - 국내금 vs 국제금 차이 (KRX vs LBMA)
- **포맷:** 테이블 + 공식 코드 블록

### docs/testing.md (~200줄)
- **역할:** "테스트를 어떻게 추가하고 실행하는가"에 답하는 파일
- **포함:**
  - 테스트 피라미드 (단위/통합/기능 비율)
  - MSW 핸들러 추가 방법 (템플릿 코드 포함)
  - data-testid 네이밍 규칙
  - renderWithProviders 사용법
  - 커버리지 목표 및 실행 명령
  - 에러 시나리오 테스트 패턴 (server.use() 오버라이드)
- **포맷:** 코드 블록 템플릿 중심

### docs/deployment.md (~180줄)
- **역할:** "배포하고 운영하려면 무엇을 설정해야 하는가"에 답하는 파일
- **포함:**
  - Railway 환경변수 설정 목록 (서버사이드 키 전체)
  - Supabase 페일오버 Edge Function 배포 절차
  - GitHub Actions CI 파이프라인 설명
  - nixpacks.toml 역할 (Node.js 강제 지정)
  - 로컬 .env 설정 방법
  - 배포 후 검증 체크리스트
- **포맷:** 단계별 명령어 코드 블록

### docs/decisions.md (~120줄)
- **역할:** "왜 이렇게 만들었는가"에 답하는 파일 — 동일 결정 반복 방지
- **포함 (ADR 형식: 제목 / 상태 / 컨텍스트 / 결정 / 결과):**
  - ADR-001: React + Vite + TanStack Query 선택
  - ADR-002: 서버사이드 API 프록시 (API 키 클라이언트 노출 방지)
  - ADR-003: Railway → Supabase Circuit Breaker 페일오버
  - ADR-004: gold-api.com 은시세 (KRX 은 현물시장 없음)
  - ADR-005: 상승=빨강, 하락=파랑 (한국 증시 관례)
- **포맷:** H3 제목별 짧은 ADR 카드

---

## 4. 작성 표준 (모든 docs/ 공통)

### Claude 가독성 극대화 규칙
1. **명령형 어조:** "Use X", "절대 Y 금지" — 설명문 지양
2. **정확한 파일 경로:** `src/hooks/useGoldPrice.ts` (대략적 묘사 금지)
3. **섹션 제목 = 질문 형태:** "환율을 가져오려면?", "테스트를 추가하려면?"
4. **현재 상태만:** 변경 이력, "~했었다", "~예정" 금지
5. **산문 최소화:** 테이블·목록·코드 블록으로 대체
6. **중복 금지:** 한 사실은 한 파일에만 존재

### 줄 수 기준 (프로젝트 규모 비례)
| 프로젝트 규모 | 파일당 상한 | 총 docs/ 상한 |
|---|---|---|
| 소형 (현재: GoldCalc) | 250줄 | 1,200줄 |
| 중형 | 400줄 | 3,000줄 |
| 대형 | 600줄 | 제한 없음 |

---

## 5. 구현 순서

1. 새 파일 6개 작성 (architecture, api-contracts, domain-knowledge, testing, deployment, decisions)
2. CLAUDE.md 슬림화
3. 기존 파일 12개 삭제
4. 전체 lint — 링크/경로 유효성 확인
5. 커밋
