---
name: quality-check
description: GoldCalc 품질 검증 — lint + type-check + test + build를 순서대로 실행하고 결과를 요약 보고한다. 기능 구현 완료 후 또는 커밋 전에 호출한다.
---

아래 순서로 품질 검증을 실행한다. 각 단계가 실패하면 즉시 원인을 진단하고 수정한 뒤 다음 단계로 넘어간다.

## 실행 순서

1. **lint** — `npm run lint`
   - 오류가 있으면 해당 파일·라인을 수정한다.

2. **type-check** — `npm run type-check`
   - 타입 에러가 있으면 원인 파악 후 수정한다.

3. **test** — `npm test`
   - 실패한 테스트가 있으면 원인 분석 후 수정한다.
   - 목표: 기존 대비 테스트 수가 줄지 않을 것.

4. **build** — `npm run build`
   - 빌드 에러가 있으면 수정한다.

## 보고 형식

모든 단계 통과 시:
```
✓ lint  ✓ type-check  ✓ test (N passed)  ✓ build — 품질 검증 완료
```

실패 단계가 있을 시:
```
✗ [단계명]: [에러 요약] → [수정 내용]
```
