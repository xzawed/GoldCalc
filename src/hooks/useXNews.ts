import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/utils/api'
import type { XTweet } from '@/types/xNews'

interface XApiTweet {
  id: string
  text: string
  created_at: string
  author_id: string
  public_metrics: {
    like_count: number
    retweet_count: number
    reply_count: number
  }
}

interface XApiUser {
  id: string
  name: string
  username: string
  profile_image_url: string
  verified?: boolean
}

interface XApiResponse {
  data?: XApiTweet[]
  includes?: { users?: XApiUser[] }
}

export function useXNews() {
  return useQuery<XTweet[]>({
    queryKey: ['xNews'],
    queryFn: async () => {
      const raw = await apiFetch<XApiResponse>('/api/x-news')
      const users = new Map((raw.includes?.users ?? []).map(u => [u.id, u]))
      return (raw.data ?? []).map(t => {
        const u = users.get(t.author_id)
        return {
          id: t.id,
          text: t.text,
          created_at: t.created_at,
          author: {
            name: u?.name ?? 'Unknown',
            username: u?.username ?? 'unknown',
            profile_image_url: u?.profile_image_url ?? '',
            verified: u?.verified ?? false,
          },
          metrics: t.public_metrics,
        }
      })
    },
    staleTime: 15 * 60 * 1000, // 서버 캐시(s-maxage=900)와 정렬
    retry: 1,
  })
}
