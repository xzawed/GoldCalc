# API Contracts — 엔드포인트·환경변수·캐시 전략

> 모든 외부 API 호출은 서버 프록시 경유. 클라이언트에서 API 키 직접 사용 금지.

---

## 서버 프록시 엔드포인트 (`server.js`)

### `GET /api/gold-price`
```
응답: { price: number, chp: number, timestamp: number }
캐시: s-maxage=3600, stale-while-revalidate=7200
에러: 503 (GOLD_API_KEY 미설정), 500 (상위 API 실패)
```

### `GET /api/gold-history?date=YYYYMMDD`
```
파라미터: date — 필수, YYYYMMDD 형식 (정규식 검증: /^\d{8}$/)
응답: { timestamp: number, close?: number, price?: number }
캐시: s-maxage=86400, stale-while-revalidate=172800
에러: 400 (date 형식 불일치), 503, 500
```

### `GET /api/exchange-rate`
```
응답: { result: string, conversion_rates: { KRW: number } }
캐시: s-maxage=3600, stale-while-revalidate=7200
에러: 503 (EXCHANGE_RATE_API_KEY 미설정), 500
```

### `GET /api/market-signals/treasury`
```
응답: { observations: [{ date: string, value: string }] }
캐시: s-maxage=86400, stale-while-revalidate=172800
에러: 503 (FRED_API_KEY 미설정), 500
```

### `GET /api/market-signals/vix`
```
응답: { "Global Quote": { "05. price": string, "10. change percent": string } }
캐시: s-maxage=86400, stale-while-revalidate=172800
에러: 503 (ALPHA_VANTAGE_KEY 미설정), 500
```

### `GET /api/domestic-gold`
```
파라미터:
  pageNo      — 정수 1~100 (기본값: 1)
  numOfRows   — 정수 1~365 (기본값: 10)
  basDt       — YYYYMMDD (선택)
  beginBasDt  — YYYYMMDD (선택)
  endBasDt    — YYYYMMDD (선택)
  likeItmsNm  — 한글·영숫자·공백 최대 30자 (선택)
응답: data.go.kr DataGoKrResponse (src/types/gold.ts 참조)
캐시: s-maxage=300, stale-while-revalidate=600
에러: 400 (파라미터 검증 실패), 503 (DATA_GO_KR_API_KEY 미설정), 500
페일오버: Railway → Supabase Edge Function (src/utils/fetchWithFailover.ts)
```

### `GET /api/news`
```
응답: { items: NewsItem[] }  (src/types/news.ts)
  NewsItem: { id, title, link, pubDate, source }
소스: 구글 뉴스 RSS (검색어: "금 시세 OR 금값 OR gold price", ko/KR)
인증: 불필요 (공개 RSS)
파싱: server.js의 parseRssItems (정규식 기반, 최대 15개)
캐시: s-maxage=1800, stale-while-revalidate=3600
에러: 500 (RSS 피드 접근 실패 또는 파싱 에러)
```

### `GET /health`
```
응답: { status: "ok", timestamp: string }
용도: UptimeRobot 등 모니터링 도구 연동
```

---

## 외부 API 원본 (서버에서만 호출)

| API | 엔드포인트 | 인증 | 무료 한도 |
|-----|---------|------|---------|
| GoldAPI.io | `https://www.goldapi.io/api/XAU/USD` | `x-access-token` 헤더 | 월 한도 있음 |
| GoldAPI.io (히스토리) | `https://www.goldapi.io/api/XAU/USD/{YYYYMMDD}` | 동일 | 동일 |
| ExchangeRate-API | `https://v6.exchangerate-api.com/v6/{KEY}/latest/USD` | URL 포함 | 월 1,500회 |
| gold-api.com (은) | `https://api.gold-api.com/price/XAG` | 불필요 | 무제한 |
| gold-api.com (은 히스토리) | `https://api.gold-api.com/price/XAG?date={YYYYMMDD}` | 불필요 | 무제한 |
| 구글 뉴스 RSS | `https://news.google.com/rss/search?q=...&hl=ko&gl=KR&ceid=KR:ko` | 불필요 | 무제한 |
| FRED | `https://api.stlouisfed.org/fred/series/observations` | URL 파라미터 | 무제한 |
| Alpha Vantage | `https://www.alphavantage.co/query` | URL 파라미터 | 일 25회 |
| data.go.kr | `https://apis.data.go.kr/1160100/...` | serviceKey | 일 1,000회 |

**silver 호출 경로:** `useSilverPrice`, `useSilverHistory` → gold-api.com 직접 (인증 불필요, 클라이언트에서 직접 호출 허용)

---

## 환경변수

### 서버사이드 전용 (Railway Variables, `VITE_` 접두사 없음)

| 변수명 | 필수 | 설명 |
|--------|------|------|
| `GOLD_API_KEY` | 필수 | GoldAPI.io 인증 키 |
| `GOLD_API_URL` | 선택 | 기본값: `https://www.goldapi.io/api` |
| `EXCHANGE_RATE_API_KEY` | 필수 | ExchangeRate-API 키 |
| `EXCHANGE_RATE_API_URL` | 선택 | 기본값: `https://v6.exchangerate-api.com/v6` |
| `DATA_GO_KR_API_KEY` | 필수 | 공공데이터포털 serviceKey |
| `FRED_API_KEY` | 선택 | FRED API 키 (미설정 시 시장신호 비활성) |
| `ALPHA_VANTAGE_KEY` | 선택 | Alpha Vantage 키 (미설정 시 VIX 비활성) |
| `PORT` | 자동 | Railway 자동 주입 |

**금융 뉴스:** 구글 뉴스 RSS는 인증 불필요 — 환경변수 없음.

### 클라이언트사이드 (`VITE_` 접두사, 번들에 포함)

| 변수명 | 필수 | 설명 |
|--------|------|------|
| `VITE_SUPABASE_URL` | 선택 | Supabase 페일오버 URL (미설정 시 페일오버 비활성) |

---

## TanStack Query 캐시 전략

| 훅 | queryKey | staleTime | 비고 |
|----|---------|----------|------|
| `useGoldPrice` | `['goldPrice']` | 1시간 | dailyCache + persistentCache |
| `useGoldHistory` | `['goldHistory', period]` | 24시간 | dailyCache + persistentCache |
| `useSilverPrice` | `['silverPrice']` | 1시간 | dailyCache + persistentCache |
| `useSilverHistory` | `['silverHistory', period]` | 24시간 | dailyCache + persistentCache |
| `useExchangeRate` | `['exchangeRate']` | 1시간 | dailyCache + persistentCache |
| `useDomesticGoldPrice` | `['domesticGoldPrice']` | 5분 | fetchWithFailover |
| `useDomesticGoldHistory` | `['domesticGoldHistory', period]` | 24시간 | fetchWithFailover |
| `useMarketSignals` | `['marketSignals']` | 24시간 | — |
| `useFinancialNews` | `['financialNews']` | 30분 | retry: 1, server cache 1800s |

**캐시 폴백 순서:** dailyCache(localStorage 당일) → API 호출 → 실패 시 persistentCache(마지막 수신값)
