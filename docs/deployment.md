# Deployment — Railway·Supabase·CI/CD 운영

---

## 배포 아키텍처

```
GitHub main push
  │
  ├─► GitHub Actions (ci.yml)  — lint + type-check + test + build 검증
  │
  └─► Railway (자동 감지)      — 프로덕션 배포 자동 실행
        Node.js 20 (nixpacks.toml 강제 지정)
        npm run build → node server.js
```

**핵심:** Railway가 GitHub를 직접 감시하여 자동 배포. `deploy.yml` 불필요.

---

## Railway 환경변수 설정

Railway 대시보드 → 서비스 → Variables에서 등록:

| 변수명 | 필수 | 값 |
|--------|------|-----|
| `GOLD_API_KEY` | 필수 | GoldAPI.io 키 |
| `GOLD_API_URL` | 선택 | `https://www.goldapi.io/api` |
| `EXCHANGE_RATE_API_KEY` | 필수 | ExchangeRate-API 키 |
| `EXCHANGE_RATE_API_URL` | 선택 | `https://v6.exchangerate-api.com/v6` |
| `DATA_GO_KR_API_KEY` | 필수 | 공공데이터포털 serviceKey |
| `FRED_API_KEY` | 선택 | FRED API 키 |
| `ALPHA_VANTAGE_KEY` | 선택 | Alpha Vantage 키 |
| `VITE_SUPABASE_URL` | 선택 | Supabase 프로젝트 URL (페일오버용) |

변수 저장 즉시 Railway가 자동 재배포.

---

## 로컬 `.env` 설정

`.env.example` 복사 후 값 입력:

```bash
cp .env.example .env
```

```env
GOLD_API_KEY=your_key_here
EXCHANGE_RATE_API_KEY=your_key_here
DATA_GO_KR_API_KEY=your_key_here
# 선택
FRED_API_KEY=
ALPHA_VANTAGE_KEY=
VITE_SUPABASE_URL=
```

`.env`는 `.gitignore`에 포함 — **절대 커밋하지 않음.**

---

## nixpacks.toml (Railway 빌드 환경 강제 지정)

```toml
[phases.setup]
nixPkgs = ["nodejs_20"]
[phases.install]
cmds = ["npm ci"]
[phases.build]
cmds = ["npm run build"]
[start]
cmd = "node server.js"
```

**이유:** `supabase/functions/` 디렉토리의 Deno import URL 때문에 nixpacks가 Deno 환경으로 오감지하여 Node.js가 설치되지 않는 문제 방지.

---

## GitHub Actions CI (`.github/workflows/ci.yml`)

PR 생성 시 자동 실행:
```
lint → type-check → test → build
```

**무료 한도:** GitHub Actions 공개 저장소 무제한.

---

## Supabase 페일오버 설정

Railway 장애 시 국내금 API를 Supabase Edge Function으로 자동 전환.

```bash
# Supabase 프로젝트 ID: ghlutgsnlceowdttxasp (ap-northeast-1)
# Edge Function URL: https://ghlutgsnlceowdttxasp.supabase.co/functions/v1/domestic-gold

# secret 설정 (최초 1회)
supabase secrets set DATA_GO_KR_API_KEY=<값> --project-ref ghlutgsnlceowdttxasp

# Edge Function 배포
supabase functions deploy domestic-gold --project-ref ghlutgsnlceowdttxasp
```

`VITE_SUPABASE_URL` 미설정 시 페일오버 비활성. 기존 Railway 직접 연결로만 동작.

---

## API 키 발급 가이드

### GoldAPI.io (국제 금시세)
1. [goldapi.io](https://www.goldapi.io/) 접속 → 회원가입
2. 대시보드에서 API 키 확인
3. 무료 플랜: 월 한도 있음 — dailyCache로 호출 최소화

### ExchangeRate-API (환율)
1. [exchangerate-api.com](https://www.exchangerate-api.com/) 접속 → 회원가입
2. 무료 플랜: 월 1,500회 — dailyCache 필수

### data.go.kr (국내 금시세)
1. [data.go.kr](https://www.data.go.kr) 접속 → 회원가입 (본인인증 필요)
2. 검색: "금융위원회_일반상품시세정보"
3. "활용신청" → 목적 입력 → 키 즉시 발급
4. 마이페이지 → 오픈API → 인증키 발급현황 → "일반 인증키(Encoding)" 복사

### Alpha Vantage (VIX, 선택)
1. [alphavantage.co](https://www.alphavantage.co/) 접속 → 무료 API 키 발급
2. 무료 플랜: 일 25회 — `staleTime: 24h` 준수 필수

### FRED API (국채 금리, 선택)
1. [fred.stlouisfed.org](https://fred.stlouisfed.org/) 접속 → API 키 발급
2. 무료, 한도 없음

---

## 배포 후 검증 체크리스트

```
□ /health 엔드포인트 응답 확인 (200 OK, status: "ok")
□ /api/gold-price 응답 확인 (price, chp, timestamp 포함)
□ /api/exchange-rate 응답 확인 (KRW 환율 포함)
□ /api/domestic-gold 응답 확인 (국내금 시세 포함)
□ 브라우저 Network 탭 — API 키 노출 없음 확인
□ 국제금 탭 계산기 동작 확인
□ 국내금 탭 계산기 동작 확인
□ 히스토리 차트 렌더링 확인
```
