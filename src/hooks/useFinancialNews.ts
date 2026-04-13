import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/utils/api'
import type { NewsItem } from '@/types/news'

interface NewsApiResponse {
  items?: NewsItem[]
}

export function useFinancialNews() {
  return useQuery<NewsItem[]>({
    queryKey: ['financialNews'],
    queryFn: async () => {
      const raw = await apiFetch<NewsApiResponse>('/api/news')
      return raw.items ?? []
    },
    staleTime: 30 * 60 * 1000, // 30분 — server.js Cache-Control s-maxage=1800과 정렬
    retry: 1,
  })
}
