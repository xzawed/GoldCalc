import { http, HttpResponse } from 'msw'
import { mockGoldPrice, mockHistoryEntries, mockForecastPoints } from '@/test/fixtures/goldData'

export const handlers = [
  http.get('*/v1/XAU', () => {
    return HttpResponse.json(mockGoldPrice)
  }),

  http.get('*/v6/*/latest/USD', () => {
    return HttpResponse.json({
      result: 'success',
      conversion_rates: { KRW: 1380 },
    })
  }),

  http.get('*/history*', () => {
    return HttpResponse.json(mockHistoryEntries)
  }),

  http.get('*/forecast*', () => {
    return HttpResponse.json(mockForecastPoints)
  }),
]
