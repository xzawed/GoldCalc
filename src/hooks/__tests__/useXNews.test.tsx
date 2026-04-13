import { describe, it, expect } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/mocks/server'
import { useXNews } from '../useXNews'

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 0 } },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useXNews', () => {
  it('returns loading state initially', () => {
    const { result } = renderHook(() => useXNews(), { wrapper: createWrapper() })
    expect(result.current.isLoading).toBe(true)
  })

  it('flattens X API response into XTweet array', async () => {
    const { result } = renderHook(() => useXNews(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toHaveLength(1)
    const tweet = result.current.data![0]
    expect(tweet.id).toBe('1')
    expect(tweet.text).toBe('금 가격 사상 최고치 경신 — 온스당 $3,200 돌파')
    expect(tweet.author.name).toBe('Gold Telegraph')
    expect(tweet.author.username).toBe('GoldTelegraph_')
    expect(tweet.author.verified).toBe(true)
    expect(tweet.metrics.like_count).toBe(100)
  })

  it('returns empty array when API response has no data field', async () => {
    server.use(
      http.get('*/api/x-news', () => HttpResponse.json({})),
    )

    const { result } = renderHook(() => useXNews(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([])
  })

  it('sets isError on API failure', async () => {
    server.use(
      http.get('*/api/x-news', () => HttpResponse.error()),
    )

    const { result } = renderHook(() => useXNews(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 5000 })
  })
})
