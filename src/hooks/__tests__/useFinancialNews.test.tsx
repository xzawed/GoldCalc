import { describe, it, expect } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/mocks/server'
import { useFinancialNews } from '../useFinancialNews'

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 0 } },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useFinancialNews', () => {
  it('returns loading state initially', () => {
    const { result } = renderHook(() => useFinancialNews(), { wrapper: createWrapper() })
    expect(result.current.isLoading).toBe(true)
  })

  it('returns news items from API response', async () => {
    const { result } = renderHook(() => useFinancialNews(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toHaveLength(2)
    const first = result.current.data![0]
    expect(first.title).toBe('금 가격 사상 최고치 경신 — 온스당 $3,200 돌파')
    expect(first.source).toBe('연합뉴스')
    expect(first.link).toBe('https://example.com/news/1')
  })

  it('returns empty array when API response has no items field', async () => {
    server.use(
      http.get('*/api/news', () => HttpResponse.json({})),
    )

    const { result } = renderHook(() => useFinancialNews(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([])
  })

  it('sets isError on API failure', async () => {
    server.use(
      http.get('*/api/news', () => HttpResponse.error()),
    )

    const { result } = renderHook(() => useFinancialNews(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 5000 })
  })
})
