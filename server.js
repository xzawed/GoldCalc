// server.js — Railway 프로덕션 서버
// Vite 빌드 결과(dist/) 정적 파일 서빙 + 국내 금시세 API 프록시

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

// Vite 빌드 정적 파일 서빙
app.use(express.static(join(__dirname, 'dist')))

// SPA 폴백 — 모든 나머지 경로는 index.html 반환
app.get('*', (_req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'))
})

app.listen(PORT, () => {
  console.log(`GoldCalc server running on port ${PORT}`)
})
