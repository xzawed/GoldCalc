import { http, HttpResponse } from 'msw'

export const errorHandlers = [
  http.get('*/v1/XAU', () => {
    return HttpResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }),

  http.get('*/v6/*/latest/USD', () => {
    return HttpResponse.json({ result: 'error' }, { status: 500 })
  }),

  http.get('*/history*', () => {
    return HttpResponse.json({ error: 'Service Unavailable' }, { status: 503 })
  }),
]
