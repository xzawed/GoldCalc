// Vercel Serverless Function — 국내 금시세 프록시
// data.go.kr API는 CORS 미지원 → 서버사이드 프록시 필수
// 엔드포인트: getGoldPriceInfo (KRX 금시장 상장 금상품 시세)

import type { VercelRequest, VercelResponse } from '@vercel/node'

const API_URL = 'https://apis.data.go.kr/1160100/service/GetGeneralProductInfoService/getGoldPriceInfo'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET')
    return res.status(204).end()
  }

  const apiKey = process.env.DATA_GO_KR_API_KEY

  if (!apiKey) {
    return res.status(503).json({
      error: '국내 금시세 API 키가 설정되지 않았습니다.',
    })
  }

  const {
    pageNo = '1',
    numOfRows = '10',
    basDt,          // 특정 일자 (YYYYMMDD)
    beginBasDt,     // 기간 시작일 (YYYYMMDD)
    endBasDt,       // 기간 종료일 (YYYYMMDD)
    likeItmsNm,     // 종목명 검색
  } = req.query

  try {
    const params = new URLSearchParams({
      serviceKey: apiKey,
      resultType: 'json',
      pageNo: pageNo as string,
      numOfRows: numOfRows as string,
    })

    if (basDt) params.set('basDt', basDt as string)
    if (beginBasDt) params.set('beginBasDt', beginBasDt as string)
    if (endBasDt) params.set('endBasDt', endBasDt as string)
    if (likeItmsNm) params.set('likeItmsNm', likeItmsNm as string)

    const response = await fetch(`${API_URL}?${params.toString()}`)

    if (!response.ok) {
      throw new Error(`data.go.kr API ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()

    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600')

    return res.status(200).json(data)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return res.status(500).json({ error: message })
  }
}
