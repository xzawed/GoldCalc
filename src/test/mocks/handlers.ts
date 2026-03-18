import { http, HttpResponse } from 'msw'

export const handlers = [
  // GoldAPI.io current price (no date suffix)
  http.get('*/XAU/USD', ({ request }) => {
    const url = new URL(request.url)
    // If URL ends with a date (8 digits), skip this handler
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
