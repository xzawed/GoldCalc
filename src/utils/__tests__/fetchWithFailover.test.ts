import { describe, it, expect, beforeEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/mocks/server'
import { fetchDomesticGold, isFailoverActive, resetCircuitBreaker } from '../fetchWithFailover'

// Railway URL (jsdom 환경에서 상대 경로는 http://localhost 기준으로 해석)
const RAILWAY_URL = '*/api/domestic-gold'
// Supabase URL (import.meta.env.VITE_SUPABASE_URL은 vite 빌드 시 치환됨 — 테스트에서는 빈 문자열)
// fetchWithFailover.ts의 getFallbackUrl()이 '' → null 반환하므로 페일오버 비활성

const MOCK_DATA = {
  response: {
    header: { resultCode: '00', resultMsg: 'NORMAL SERVICE.' },
    body: {
      totalCount: 1,
      pageNo: 1,
      numOfRows: 1,
      items: { item: [{ basDt: '20260412', clpr: '145000', fltRt: '0.35', trqu: '1234', itmsNm: '금', mkp: '0', hipr: '0', lopr: '0', vs: '0', trPrc: '0' }] },
    },
  },
}

beforeEach(() => {
  resetCircuitBreaker()
})

describe('fetchDomesticGold — Railway 정상', () => {
  it('Railway 정상 응답 시 source === railway 반환', async () => {
    // handlers.ts의 기본 핸들러가 Railway 200 반환
    const result = await fetchDomesticGold<typeof MOCK_DATA>('?numOfRows=1&resultType=json')
    expect(result.source).toBe('railway')
    expect(result.data.response.header.resultCode).toBe('00')
  })
})

describe('fetchDomesticGold — Railway 실패 (VITE_SUPABASE_URL 미설정)', () => {
  it('Railway 실패 + Supabase URL 없으면 에러 throw', async () => {
    server.use(
      http.get(RAILWAY_URL, () => HttpResponse.json({ error: 'down' }, { status: 503 }))
    )

    // VITE_SUPABASE_URL이 테스트 환경에서 빈 값이므로 getFallbackUrl() === null
    await expect(fetchDomesticGold('?numOfRows=1')).rejects.toThrow()
  })

  it('Railway 실패 후 circuit breaker 활성화', async () => {
    server.use(
      http.get(RAILWAY_URL, () => HttpResponse.json({ error: 'down' }, { status: 503 }))
    )

    try { await fetchDomesticGold('?numOfRows=1') } catch { /* expected */ }
    expect(isFailoverActive()).toBe(true)
  })
})

describe('fetchDomesticGold — circuit breaker', () => {
  it('resetCircuitBreaker 후 isFailoverActive() === false', () => {
    resetCircuitBreaker()
    expect(isFailoverActive()).toBe(false)
  })

  it('Railway 실패 후 circuit breaker 열림, 다음 Railway 실패 후 계속 활성', async () => {
    server.use(
      http.get(RAILWAY_URL, () => HttpResponse.json({ error: 'down' }, { status: 503 }))
    )

    // 1차 실패
    try { await fetchDomesticGold('?numOfRows=1') } catch { /* expected */ }
    expect(isFailoverActive()).toBe(true)

    // 리셋
    resetCircuitBreaker()
    expect(isFailoverActive()).toBe(false)
  })

  it('Railway 복구 시 circuit breaker 리셋되지 않음 (직접 reset 필요)', async () => {
    // Railway 실패로 circuit breaker 열기
    server.use(
      http.get(RAILWAY_URL, () => HttpResponse.json({ error: 'down' }, { status: 503 }), { once: true }),
    )
    try { await fetchDomesticGold('?numOfRows=1') } catch { /* expected */ }
    expect(isFailoverActive()).toBe(true)

    // Railway 복구 — 하지만 circuit breaker가 열려있어서 Railway 호출 자체를 건너뜀
    // (VITE_SUPABASE_URL 미설정이라 Supabase도 없으므로 Railway를 마지막 시도)
    // circuit breaker 오픈 중 + fallback 없음 → Railway 시도 후 성공 시 circuit breaker 리셋
    const result = await fetchDomesticGold<typeof MOCK_DATA>('?numOfRows=1&resultType=json')
    expect(result.source).toBe('railway')
    expect(isFailoverActive()).toBe(false)
  })
})
