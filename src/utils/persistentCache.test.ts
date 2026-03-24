import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { getPersistentCache, setPersistentCache } from './persistentCache'

describe('getPersistentCache', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => localStorage.clear())

  it('returns null when no data stored', () => {
    expect(getPersistentCache('test')).toBeNull()
  })

  it('returns stored entry with data and savedAt', () => {
    const data = { price: 3200, rate: 1450 }
    const entry = { data, savedAt: '2026-03-25T10:00:00.000Z' }
    localStorage.setItem('gc_pk_test', JSON.stringify(entry))
    const result = getPersistentCache<typeof data>('test')
    expect(result?.data).toEqual(data)
    expect(result?.savedAt).toBe('2026-03-25T10:00:00.000Z')
  })

  it('returns null on invalid JSON', () => {
    localStorage.setItem('gc_pk_test', 'invalid-json')
    expect(getPersistentCache('test')).toBeNull()
  })
})

describe('setPersistentCache', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-25T10:00:00.000Z'))
  })
  afterEach(() => {
    vi.useRealTimers()
    localStorage.clear()
  })

  it('saves data with current timestamp', () => {
    const data = { value: 99 }
    setPersistentCache('goldprice', data)
    const result = getPersistentCache<typeof data>('goldprice')
    expect(result?.data).toEqual(data)
    expect(result?.savedAt).toBe('2026-03-25T10:00:00.000Z')
  })

  it('overwrites previously stored value', () => {
    setPersistentCache('rate', { exchangeRate: 1400 })
    setPersistentCache('rate', { exchangeRate: 1450 })
    const result = getPersistentCache<{ exchangeRate: number }>('rate')
    expect(result?.data.exchangeRate).toBe(1450)
  })

  it('different keys are stored independently', () => {
    setPersistentCache('gold', { price: 3200 })
    setPersistentCache('silver', { price: 35 })
    expect(getPersistentCache<{ price: number }>('gold')?.data.price).toBe(3200)
    expect(getPersistentCache<{ price: number }>('silver')?.data.price).toBe(35)
  })

  it('handles localStorage errors gracefully', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('storage full')
    })
    expect(() => setPersistentCache('test', { value: 1 })).not.toThrow()
    spy.mockRestore()
  })
})
