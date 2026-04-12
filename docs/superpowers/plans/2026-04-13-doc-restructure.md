# GoldCalc 문서 재편 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 기존 12개 docs 파일을 Claude 가독성 최적화 구조 6개로 재편하고 CLAUDE.md를 슬림화

**Architecture:** 도메인별 평면 구조. 각 파일 200줄 이하, 현재 상태(as-is)만 기술, 테이블·코드 블록 우선. CLAUDE.md는 인덱스+규칙만 담당.

**Tech Stack:** Markdown, 기존 프로젝트 문서 소스

---

### Task 1: docs/domain-knowledge.md 작성

**Files:**
- Create: `docs/domain-knowledge.md`

- [ ] **Step 1:** 파일 작성 (단위·순도·공식·시장 관례)
- [ ] **Step 2:** 줄 수 120줄 이하 확인
- [ ] **Step 3:** 커밋

---

### Task 2: docs/api-contracts.md 작성

**Files:**
- Create: `docs/api-contracts.md`

- [ ] **Step 1:** 파일 작성 (프록시 엔드포인트·외부 API·env vars)
- [ ] **Step 2:** 줄 수 250줄 이하 확인
- [ ] **Step 3:** 커밋

---

### Task 3: docs/architecture.md 작성

**Files:**
- Create: `docs/architecture.md`

- [ ] **Step 1:** 파일 작성 (컴포넌트 맵·데이터 흐름·페일오버)
- [ ] **Step 2:** 줄 수 220줄 이하 확인
- [ ] **Step 3:** 커밋

---

### Task 4: docs/testing.md 작성

**Files:**
- Create: `docs/testing.md`

- [ ] **Step 1:** 파일 작성 (전략·MSW 패턴·testid·커버리지)
- [ ] **Step 2:** 줄 수 220줄 이하 확인
- [ ] **Step 3:** 커밋

---

### Task 5: docs/deployment.md 작성

**Files:**
- Create: `docs/deployment.md`

- [ ] **Step 1:** 파일 작성 (Railway env·Supabase·CI·체크리스트)
- [ ] **Step 2:** 줄 수 200줄 이하 확인
- [ ] **Step 3:** 커밋

---

### Task 6: docs/decisions.md 작성

**Files:**
- Create: `docs/decisions.md`

- [ ] **Step 1:** 파일 작성 (ADR-001~005)
- [ ] **Step 2:** 줄 수 130줄 이하 확인
- [ ] **Step 3:** 커밋

---

### Task 7: CLAUDE.md 슬림화

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1:** 도메인 지식·API 상세·스프린트 히스토리 제거, docs/ 인덱스 추가
- [ ] **Step 2:** 줄 수 160줄 이하 확인
- [ ] **Step 3:** 커밋

---

### Task 8: 기존 파일 삭제

**Files:**
- Delete: `docs/01-prd.md`, `docs/02-techstack.md`, `docs/03-skills.md`
- Delete: `docs/04-testing.md`, `docs/05-cicd.md`
- Delete: `docs/06-sprint-01.md` ~ `docs/10-sprint-05.md`
- Delete: `docs/11-decisions.md`, `docs/12-api-key-guide.md`

- [ ] **Step 1:** 12개 파일 삭제
- [ ] **Step 2:** 최종 커밋
