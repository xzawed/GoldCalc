// domestic-gold/index.ts — Supabase Edge Function
// Railway /api/domestic-gold 프록시의 Deno 런타임 복제본
// Railway 장애 시 클라이언트가 자동으로 이 엔드포인트로 페일오버

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

const DOMESTIC_GOLD_API_URL =
  'https://apis.data.go.kr/1160100/service/GetGeneralProductInfoService/getGoldPriceInfo'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

serve(async (req: Request) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  const apiKey = Deno.env.get('DATA_GO_KR_API_KEY')
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: '국내 금시세 API 키가 설정되지 않았습니다.' }),
      { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }

  const url = new URL(req.url)

  const params = new URLSearchParams({
    serviceKey: apiKey,
    resultType: 'json',
    pageNo: url.searchParams.get('pageNo') ?? '1',
    numOfRows: url.searchParams.get('numOfRows') ?? '10',
  })

  for (const key of ['basDt', 'beginBasDt', 'endBasDt', 'likeItmsNm']) {
    const val = url.searchParams.get(key)
    if (val) params.set(key, val)
  }

  try {
    const response = await fetch(`${DOMESTIC_GOLD_API_URL}?${params.toString()}`)

    if (!response.ok) {
      throw new Error(`data.go.kr API ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': 's-maxage=300, stale-while-revalidate=600',
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
