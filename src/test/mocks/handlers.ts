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

  // Silver price proxy (/api/silver-price)
  http.get('*/api/silver-price', () => {
    return HttpResponse.json({
      price: 33.5,
      chp: 0.45,
      timestamp: 1742278800,
    })
  }),

  // Silver history proxy (/api/silver-history?date=YYYYMMDD)
  http.get('*/api/silver-history', () => {
    return HttpResponse.json({
      timestamp: 1742192400,
      close: 33.0,
      prev_close_price: 32.8,
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

  // Financial news proxy (/api/news) — Google News RSS 기반
  http.get('*/api/news', () => {
    return HttpResponse.json({
      items: [
        {
          id: 'https://example.com/news/1',
          title: '금 가격 사상 최고치 경신 — 온스당 $3,200 돌파',
          link: 'https://example.com/news/1',
          pubDate: 'Mon, 13 Apr 2026 00:00:00 GMT',
          source: '연합뉴스',
        },
        {
          id: 'https://example.com/news/2',
          title: '달러 약세에 금값 상승세 지속',
          link: 'https://example.com/news/2',
          pubDate: 'Mon, 13 Apr 2026 01:00:00 GMT',
          source: '매일경제',
        },
      ],
    })
  }),
]
