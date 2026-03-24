import { http, HttpResponse } from 'msw'

export const handlers = [
  // GoldAPI.io current price (no date suffix)
  http.get('*/XAU/USD', ({ request }) => {
    const url = new URL(request.url)
    if (/\/XAU\/USD\/\d{8}$/.test(url.pathname)) return
    return HttpResponse.json({
      price: 2650.5,
      chp: 0.85,
      timestamp: 1742278800,
      prev_close_price: 2628.0,
    })
  }),

  // GoldAPI.io history (date-specific)
  http.get('*/XAU/USD/:date', () => {
    return HttpResponse.json({
      timestamp: 1742192400,
      close: 2640.0,
      prev_close_price: 2620.0,
    })
  }),

  // ExchangeRate-API
  http.get('*/v6/*/latest/USD', () => {
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

  // Alpha Vantage (market signals)
  http.get('*alphavantage*', () => {
    return HttpResponse.json({
      'Global Quote': {
        '05. price': '18.50',
        '10. change percent': '1.25%',
      },
    })
  }),

  // FRED API (Treasury/DXY)
  http.get('*api.stlouisfed.org*', () => {
    return HttpResponse.json({
      observations: [
        { date: '2026-03-18', value: '4.25' },
      ],
    })
  }),
]
