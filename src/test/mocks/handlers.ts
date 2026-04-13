import { http, HttpResponse } from 'msw'

export const handlers = [
  // Gold price proxy (/api/gold-price)
  http.get('*/api/gold-price', () => {
    return HttpResponse.json({
      price: 2650.5,
      chp: 0.85,
      timestamp: 1742278800,
      prev_close_price: 2628.0,
    })
  }),

  // Gold history proxy (/api/gold-history?date=YYYYMMDD)
  http.get('*/api/gold-history', () => {
    return HttpResponse.json({
      timestamp: 1742192400,
      close: 2640.0,
      prev_close_price: 2620.0,
    })
  }),

  // Exchange rate proxy (/api/exchange-rate)
  http.get('*/api/exchange-rate', () => {
    return HttpResponse.json({
      result: 'success',
      conversion_rates: { KRW: 1380 },
    })
  }),

  // gold-api.com silver price (current)
  http.get('https://api.gold-api.com/price/XAG', ({ request }) => {
    const url = new URL(request.url)
    if (url.searchParams.get('date')) return // let history handler handle it
    return HttpResponse.json({
      name: 'Silver',
      price: 33.5,
      symbol: 'XAG',
      updatedAt: '2026-03-25T10:00:00Z',
      updatedAtReadable: 'just now',
    })
  }),

  // gold-api.com silver history (date param)
  http.get('https://api.gold-api.com/price/XAG', () => {
    return HttpResponse.json({
      name: 'Silver',
      price: 33.0,
      symbol: 'XAG',
      updatedAt: '2026-03-24T10:00:00Z',
      updatedAtReadable: 'yesterday',
    })
  }),

  // domestic gold proxy (/api/domestic-gold)
  http.get('*/api/domestic-gold', () => {
    return HttpResponse.json({
      response: {
        header: { resultCode: '00', resultMsg: 'NORMAL SERVICE.' },
        body: {
          totalCount: 1,
          pageNo: 1,
          numOfRows: 1,
          items: {
            item: [
              {
                basDt: '20260325',
                itmsNm: '금',
                clpr: '145000',
                mkp: '144500',
                hipr: '145500',
                lopr: '144000',
                vs: '500',
                fltRt: '0.35',
                trqu: '1234',
                trPrc: '178830000',
              },
            ],
          },
        },
      },
    })
  }),

  // Market signals proxy — treasury (/api/market-signals/treasury)
  http.get('*/api/market-signals/treasury', () => {
    return HttpResponse.json({
      observations: [
        { date: '2026-03-18', value: '4.25' },
      ],
    })
  }),

  // Market signals proxy — VIX (/api/market-signals/vix)
  http.get('*/api/market-signals/vix', () => {
    return HttpResponse.json({
      'Global Quote': {
        '05. price': '18.50',
        '10. change percent': '1.25%',
      },
    })
  }),

  // X news proxy (/api/x-news)
  http.get('*/api/x-news', () => {
    return HttpResponse.json({
      data: [
        {
          id: '1',
          text: '금 가격 사상 최고치 경신 — 온스당 $3,200 돌파',
          created_at: '2026-04-13T00:00:00Z',
          author_id: 'u1',
          public_metrics: { like_count: 100, retweet_count: 20, reply_count: 5 },
        },
      ],
      includes: {
        users: [
          {
            id: 'u1',
            name: 'Gold Telegraph',
            username: 'GoldTelegraph_',
            profile_image_url: 'https://example.com/avatar.jpg',
            verified: true,
          },
        ],
      },
    })
  }),
]
