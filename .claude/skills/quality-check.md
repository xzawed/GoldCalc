---
name: quality-check
description: GoldCalc 품질 검증 — lint + type-check + test + build를 순서대로 실행하고 결과를 요약 보고한다. 기능 구현 완료 후 또는 커밋 전에 호출한다.
---

## 호출 방법

이 파일은 Claude Code `Skill` 도구가 아닌 **`Read` 도구로 직접 읽어 실행**한다.
프로젝트 스킬(`.claude/skills/`)은 superpowers 플러그인에 등록된 스킬과 달리 자동 발견되지 않는다.

실행 시 `npm run check` 단일 명령으로 전체 검증을 수행한다:

```bash
npm run check
# 내부 순서: lint → type-check → test → build
```

단계별로 실행해야 하는 경우:

```bash
npm run lint
npm run type-check
npm test
npm run build
```

---

## 실행 절차

1. **`npm run check`** 실행
2. 실패 단계 발생 시 → 즉시 원인 진단 및 수정 후 재실행
3. 목표: 기존 대비 테스트 수가 줄지 않을 것 (현재 기준: 142개)

---

## 보고 형식

모든 단계 통과 시:
```
✓ lint  ✓ type-check  ✓ test (N passed)  ✓ build — 품질 검증 완료
```

실패 단계가 있을 시:
```
✗ [단계명]: [에러 요약] → [수정 내용]
```
