import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { getDailyCache, setDailyCache } from './dailyCache'

const FIXED_DATE = '2026-03-25'
const YESTERDAY = '2026-03-24'

describe('getDailyCache', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.useFakeTimers()
    vi.setSystemTime(new Date(`${FIXED_DATE}T12:00:00Z`))
  })
  afterEach(() => {
    vi.useRealTimers()
    localStorage.clear()
  })

  it('returns null when no data stored', () => {
    expect(getDailyCache('test')).toBeNull()
  })

  it('returns stored data for today', () => {
    const data = { value: 42, label: 'test' }
    localStorage.setItem(`gc_test:${FIXED_DATE}`, JSON.stringify(data))
    expect(getDailyCache('test')).toEqual(data)
  })

  it('returns null when data is from a different day', () => {
    localStorage.setItem(`gc_test:${YESTERDAY}`, JSON.stringify({ value: 1 }))
    expect(getDailyCache('test')).toBeNull()
  })

  it('returns null on invalid JSON', () => {
    localStorage.setItem(`gc_test:${FIXED_DATE}`, 'not-json')
    expect(getDailyCache('test')).toBeNull()
  })
})

describe('setDailyCache', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.useFakeTimers()
    vi.setSystemTime(new Date(`${FIXED_DATE}T12:00:00Z`))
  })
  afterEach(() => {
    vi.useRealTimers()
    localStorage.clear()
  })

  it('stores data under today\'s key', () => {
    const data = { price: 100 }
    setDailyCache('goldprice', data)
    const raw = localStorage.getItem(`gc_goldprice:${FIXED_DATE}`)
    expect(JSON.parse(raw!)).toEqual(data)
  })

  it('stored data is retrievable via getDailyCache', () => {
    const data = { rate: 1450 }
    setDailyCache('exchangerate', data)
    expect(getDailyCache('exchangerate')).toEqual(data)
  })

  it('removes old cache entries for the same key', () => {
    // 어제 캐시를 직접 심어두고
    localStorage.setItem(`gc_goldprice:${YESTERDAY}`, JSON.stringify({ price: 50 }))
    // 오늘 캐시를 저장하면
    setDailyCache('goldprice', { price: 100 })
    // 어제 캐시가 삭제되어야 함
    expect(localStorage.getItem(`gc_goldprice:${YESTERDAY}`)).toBeNull()
    // 오늘 캐시는 존재
    expect(localStorage.getItem(`gc_goldprice:${FIXED_DATE}`)).not.toBeNull()
  })

  it('does not remove cache entries for different keys', () => {
    localStorage.setItem(`gc_silverhistory:${YESTERDAY}`, JSON.stringify([]))
    setDailyCache('goldprice', { price: 100 })
    // 다른 키 캐시는 영향 없음
    expect(localStorage.getItem(`gc_silverhistory:${YESTERDAY}`)).not.toBeNull()
  })

  it('handles localStorage errors gracefully', () => {
    const original = localStorage.setItem.bind(localStorage)
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('storage full')
    })
    // 에러가 throw되지 않아야 함
    expect(() => setDailyCache('test', { value: 1 })).not.toThrow()
    spy.mockRestore()
    void original
  })
})
