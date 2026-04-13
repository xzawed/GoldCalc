// server.js — Railway 프로덕션 서버
// Vite 빌드 결과(dist/) 정적 파일 서빙 + API 프록시 (API 키는 서버사이드 전용)

import 'dotenv/config' // 로컬 .env 자동 로드 (Railway는 env 자동 주입이라 no-op)
import express from 'express'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3000

const DOMESTIC_GOLD_API_URL =
  'https://apis.data.go.kr/1160100/service/GetGeneralProductInfoService/getGoldPriceInfo'

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
}

/** 날짜 파라미터 검증: YYYYMMDD 형식 8자리 숫자만 허용 */
function isValidDate(v) {
  return typeof v === 'string' && /^\d{8}$/.test(v)
}

/** 종목명 검증: 한글·영문·숫자·공백만 허용, 최대 30자 */
function isValidItemName(v) {
  return typeof v === 'string' && /^[\w\uAC00-\uD7A3\s]{1,30}$/.test(v)
}

/** 페이지 번호/건수 검증: 1 이상 최대값 이하 정수 */
function isValidPageInt(v, max) {
  const n = Number(v)
  return Number.isInteger(n) && n >= 1 && n <= max
}

// 국내 금시세 프록시 — CORS preflight
app.options('/api/domestic-gold', (_req, res) => {
  setCorsHeaders(res)
  res.status(204).end()
})

// 국내 금시세 프록시 — data.go.kr CORS 미지원 우회
app.get('/api/domestic-gold', async (req, res) => {
  const apiKey = process.env.DATA_GO_KR_API_KEY

  if (!apiKey) {
    return res.status(503).json({ error: '국내 금시세 API 키가 설정되지 않았습니다.' })
  }

  const {
    pageNo = '1',
    numOfRows = '10',
    basDt,
    beginBasDt,
    endBasDt,
    likeItmsNm,
  } = req.query

  // 입력 검증
  if (!isValidPageInt(pageNo, 100)) {
    return res.status(400).json({ error: 'pageNo는 1~100 사이의 정수여야 합니다.' })
  }
  if (!isValidPageInt(numOfRows, 365)) {
    return res.status(400).json({ error: 'numOfRows는 1~365 사이의 정수여야 합니다.' })
  }
  if (basDt && !isValidDate(basDt)) {
    return res.status(400).json({ error: 'basDt는 YYYYMMDD 형식이어야 합니다.' })
  }
  if (beginBasDt && !isValidDate(beginBasDt)) {
    return res.status(400).json({ error: 'beginBasDt는 YYYYMMDD 형식이어야 합니다.' })
  }
  if (endBasDt && !isValidDate(endBasDt)) {
    return res.status(400).json({ error: 'endBasDt는 YYYYMMDD 형식이어야 합니다.' })
  }
  if (likeItmsNm && !isValidItemName(likeItmsNm)) {
    return res.status(400).json({ error: 'likeItmsNm에 허용되지 않는 문자가 포함되어 있습니다.' })
  }

  try {
    const params = new URLSearchParams({
      serviceKey: apiKey,
      resultType: 'json',
      pageNo: String(pageNo),
      numOfRows: String(numOfRows),
    })

    if (basDt) params.set('basDt', String(basDt))
    if (beginBasDt) params.set('beginBasDt', String(beginBasDt))
    if (endBasDt) params.set('endBasDt', String(endBasDt))
    if (likeItmsNm) params.set('likeItmsNm', String(likeItmsNm))

    const response = await fetch(`${DOMESTIC_GOLD_API_URL}?${params.toString()}`)

    if (!response.ok) {
      throw new Error(`data.go.kr API ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()

    setCorsHeaders(res)
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600')

    return res.status(200).json(data)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return res.status(500).json({ error: message })
  }
})

// ─── 금시세 프록시 (GoldAPI.io) ────────────────────────────────────────────

const GOLD_API_BASE = process.env.GOLD_API_URL || 'https://www.goldapi.io/api'

app.options('/api/gold-price', (_req, res) => { setCorsHeaders(res); res.status(204).end() })
app.options('/api/gold-history', (_req, res) => { setCorsHeaders(res); res.status(204).end() })

app.get('/api/gold-price', async (_req, res) => {
  const apiKey = process.env.GOLD_API_KEY
  if (!apiKey) return res.status(503).json({ error: 'GOLD_API_KEY 미설정' })
  try {
    const response = await fetch(`${GOLD_API_BASE}/XAU/USD`, {
      headers: { 'x-access-token': apiKey },
    })
    if (!response.ok) throw new Error(`GoldAPI ${response.status}`)
    setCorsHeaders(res)
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=7200')
    return res.status(200).json(await response.json())
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' })
  }
})

app.get('/api/gold-history', async (req, res) => {
  const apiKey = process.env.GOLD_API_KEY
  if (!apiKey) return res.status(503).json({ error: 'GOLD_API_KEY 미설정' })
  const { date } = req.query
  if (!date || !isValidDate(String(date))) {
    return res.status(400).json({ error: 'date는 YYYYMMDD 형식이어야 합니다.' })
  }
  try {
    const response = await fetch(`${GOLD_API_BASE}/XAU/USD/${date}`, {
      headers: { 'x-access-token': apiKey },
    })
    if (!response.ok) throw new Error(`GoldAPI ${response.status}`)
    setCorsHeaders(res)
    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=172800')
    return res.status(200).json(await response.json())
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' })
  }
})

// ─── 환율 프록시 (ExchangeRate-API) ────────────────────────────────────────

const EXCHANGE_RATE_BASE = process.env.EXCHANGE_RATE_API_URL || 'https://v6.exchangerate-api.com/v6'

app.options('/api/exchange-rate', (_req, res) => { setCorsHeaders(res); res.status(204).end() })

app.get('/api/exchange-rate', async (_req, res) => {
  const apiKey = process.env.EXCHANGE_RATE_API_KEY
  if (!apiKey) return res.status(503).json({ error: 'EXCHANGE_RATE_API_KEY 미설정' })
  try {
    const response = await fetch(`${EXCHANGE_RATE_BASE}/${apiKey}/latest/USD`)
    if (!response.ok) throw new Error(`ExchangeRate-API ${response.status}`)
    setCorsHeaders(res)
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=7200')
    return res.status(200).json(await response.json())
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' })
  }
})

// ─── 시장 신호 프록시 (FRED + Alpha Vantage) ────────────────────────────────

app.options('/api/market-signals/treasury', (_req, res) => { setCorsHeaders(res); res.status(204).end() })
app.options('/api/market-signals/vix', (_req, res) => { setCorsHeaders(res); res.status(204).end() })

app.get('/api/market-signals/treasury', async (_req, res) => {
  const apiKey = process.env.FRED_API_KEY
  if (!apiKey) return res.status(503).json({ error: 'FRED_API_KEY 미설정' })
  try {
    const url = `https://api.stlouisfed.org/fred/series/observations?series_id=DGS10&api_key=${apiKey}&file_type=json&limit=1&sort_order=desc`
    const response = await fetch(url)
    if (!response.ok) throw new Error(`FRED API ${response.status}`)
    setCorsHeaders(res)
    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=172800')
    return res.status(200).json(await response.json())
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' })
  }
})

app.get('/api/market-signals/vix', async (_req, res) => {
  const apiKey = process.env.ALPHA_VANTAGE_KEY
  if (!apiKey) return res.status(503).json({ error: 'ALPHA_VANTAGE_KEY 미설정' })
  try {
    const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=VIX&apikey=${apiKey}`
    const response = await fetch(url)
    if (!response.ok) throw new Error(`Alpha Vantage ${response.status}`)
    setCorsHeaders(res)
    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=172800')
    return res.status(200).json(await response.json())
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' })
  }
})

// ─── 금융 뉴스 프록시 (구글 뉴스 RSS, 무료·인증 불필요) ─────────────────────

const NEWS_RSS_URL =
  'https://news.google.com/rss/search?q=' +
  encodeURIComponent('금 시세 OR 금값 OR gold price') +
  '&hl=ko&gl=KR&ceid=KR:ko'

/** 간단한 RSS <item> 파서 — Google News RSS 전용 */
function parseRssItems(xml) {
  const items = []
  const itemRegex = /<item>([\s\S]*?)<\/item>/g
  let match
  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1]
    const title = extractTag(block, 'title')
    const link = extractTag(block, 'link')
    const pubDate = extractTag(block, 'pubDate')
    const source = extractTag(block, 'source')
    if (title && link) {
      items.push({
        id: link,
        title: decodeHtml(title),
        link,
        pubDate,
        source: source ? decodeHtml(source) : '',
      })
    }
  }
  return items
}

function extractTag(xml, tag) {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`)
  const m = re.exec(xml)
  if (!m) return ''
  return m[1].replace(/^<!\[CDATA\[/, '').replace(/\]\]>$/, '').trim()
}

function decodeHtml(s) {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
}

app.options('/api/news', (_req, res) => { setCorsHeaders(res); res.status(204).end() })

app.get('/api/news', async (_req, res) => {
  try {
    const response = await fetch(NEWS_RSS_URL)
    if (!response.ok) throw new Error(`Google News RSS ${response.status}`)
    const xml = await response.text()
    const items = parseRssItems(xml).slice(0, 15)
    setCorsHeaders(res)
    res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=3600')
    return res.status(200).json({ items })
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' })
  }
})

// 헬스체크 — 모니터링 도구(UptimeRobot 등) 연동용
app.get('/health', (_req, res) => {
  setCorsHeaders(res)
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Vite 빌드 정적 파일 서빙
app.use(express.static(join(__dirname, 'dist')))

// SPA 폴백 — 모든 나머지 경로는 index.html 반환
app.get('*', (_req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'))
})

app.listen(PORT, () => {
  console.log(`GoldCalc server running on port ${PORT}`)
})
