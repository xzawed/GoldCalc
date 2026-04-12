import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useApiAvailability } from './useApiAvailability'
import { server } from '@/test/mocks/server'
import { http, HttpResponse } from 'msw'

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 0 } },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useApiAvailability', () => {
  beforeEach(() => localStorage.clear())

  it('returns null for all tabs while loading', () => {
    const { result } = renderHook(() => useApiAvailability(), { wrapper: createWrapper() })
    expect(result.current['intl-gold']).toBeNull()
    expect(result.current['intl-silver']).toBeNull()
    expect(result.current['domestic-gold']).toBeNull()
    expect(result.current['domestic-silver']).toBeNull()
  })

  it('returns true for all tabs when all APIs succeed', async () => {
    const { result } = renderHook(() => useApiAvailability(), { wrapper: createWrapper() })
    await waitFor(() => {
      expect(result.current['intl-gold']).not.toBeNull()
    })
    expect(result.current['intl-gold']).toBe(true)
    expect(result.current['intl-silver']).toBe(true)
    expect(result.current['domestic-gold']).toBe(true)
    expect(result.current['domestic-silver']).toBe(true)
  })

  it('returns false for intl-gold when gold API fails with no cache', async () => {
    server.use(
      http.get('*/api/gold-price', () => HttpResponse.error()),
    )
    const { result } = renderHook(() => useApiAvailability(), { wrapper: createWrapper() })
    await waitFor(() => {
      expect(result.current['intl-gold']).not.toBeNull()
    }, { timeout: 5000 })
    expect(result.current['intl-gold']).toBe(false)
  })

  it('returns false for intl-gold/silver when exchange rate API fails with no cache', async () => {
    server.use(
      http.get('*/api/exchange-rate', () => HttpResponse.error()),
    )
    const { result } = renderHook(() => useApiAvailability(), { wrapper: createWrapper() })
    await waitFor(() => {
      expect(result.current['intl-gold']).not.toBeNull()
    }, { timeout: 5000 })
    expect(result.current['intl-gold']).toBe(false)
    expect(result.current['intl-silver']).toBe(false)
  })

  it('returns false for domestic-gold when domestic API fails with no cache', async () => {
    server.use(
      http.get('*/api/domestic-gold', () => HttpResponse.error()),
    )
    const { result } = renderHook(() => useApiAvailability(), { wrapper: createWrapper() })
    await waitFor(() => {
      expect(result.current['domestic-gold']).not.toBeNull()
    }, { timeout: 5000 })
    expect(result.current['domestic-gold']).toBe(false)
  })

  it('returns false for intl-silver/domestic-silver when silver API fails with no cache', async () => {
    server.use(
      http.get('https://api.gold-api.com/price/XAG', () => HttpResponse.error()),
    )
    const { result } = renderHook(() => useApiAvailability(), { wrapper: createWrapper() })
    await waitFor(() => {
      expect(result.current['intl-silver']).not.toBeNull()
    }, { timeout: 5000 })
    expect(result.current['intl-silver']).toBe(false)
    expect(result.current['domestic-silver']).toBe(false)
  })
})
