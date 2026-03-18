import { http, HttpResponse } from 'msw'

export const goldErrorHandler = http.get('*/XAU/USD', () => {
  return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
})

export const exchangeRateErrorHandler = http.get('*/v6/*/latest/USD', () => {
  return HttpResponse.json({ result: 'error' }, { status: 429 })
})

export const historyErrorHandler = http.get('*/XAU/USD/:date', () => {
  return HttpResponse.json({ message: 'Not Found' }, { status: 404 })
})
