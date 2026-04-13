import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Heart, MessageCircle, Repeat2 } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useXNews } from '@/hooks/useXNews'
import { DEFAULT_X_LIST_PUBLIC_URL } from '@/constants/newsDefaults'
import type { XTweet } from '@/types/xNews'

function NewsSkeleton() {
  return (
    <div className="space-y-3" data-testid="news-skeleton">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex gap-3 items-start">
          <Skeleton className="h-10 w-10 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}

function ErrorFallback() {
  return (
    <div
      className="flex flex-col items-center gap-3 py-8 text-center"
      data-testid="news-error"
    >
      <p className="text-muted-foreground text-sm">
        X 소식을 불러올 수 없습니다.
        <br />
        잠시 후 다시 시도해 주세요.
      </p>
      <a
        href={DEFAULT_X_LIST_PUBLIC_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-muted/50 border border-border/40 text-sm font-medium text-foreground hover:bg-muted transition-colors"
      >
        X에서 직접 보기
        <span aria-hidden="true">&rarr;</span>
      </a>
    </div>
  )
}

function TweetCard({ tweet }: { tweet: XTweet }) {
  const tweetUrl = `https://x.com/${tweet.author.username}/status/${tweet.id}`
  const timeAgo = formatDistanceToNow(new Date(tweet.created_at), {
    addSuffix: true,
    locale: ko,
  })

  return (
    <article
      className="flex gap-3 py-3 border-b border-border/40 last:border-b-0"
      data-testid={`news-item-${tweet.id}`}
    >
      <img
        src={tweet.author.profile_image_url}
        alt={`${tweet.author.name} 프로필`}
        className="h-10 w-10 rounded-full shrink-0 object-cover"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-sm font-semibold truncate">{tweet.author.name}</span>
          {tweet.author.verified && (
            <span
              className="text-blue-400 text-xs"
              aria-label="인증된 계정"
            >
              ✓
            </span>
          )}
          <span className="text-xs text-muted-foreground">@{tweet.author.username}</span>
          <span className="text-xs text-muted-foreground ml-auto">{timeAgo}</span>
        </div>
        <a
          href={tweetUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${tweet.author.name}의 트윗: ${tweet.text}`}
          className="block mt-1 text-sm text-foreground/90 line-clamp-4 hover:text-foreground transition-colors"
        >
          {tweet.text}
        </a>
        <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Heart className="h-3 w-3" aria-hidden="true" />
            {tweet.metrics.like_count.toLocaleString('ko-KR')}
          </span>
          <span className="flex items-center gap-1">
            <Repeat2 className="h-3 w-3" aria-hidden="true" />
            {tweet.metrics.retweet_count.toLocaleString('ko-KR')}
          </span>
          <span className="flex items-center gap-1">
            <MessageCircle className="h-3 w-3" aria-hidden="true" />
            {tweet.metrics.reply_count.toLocaleString('ko-KR')}
          </span>
        </div>
      </div>
    </article>
  )
}

export default function NewsSection() {
  const { data: tweets, isLoading, isError } = useXNews()

  return (
    <section aria-labelledby="news-title" data-testid="news-section">
      <Card className="card-glow-gold">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle id="news-title" className="flex items-center gap-2 text-base">
              <span
                className="w-1.5 h-5 rounded-full bg-emerald-400"
                aria-hidden="true"
              />
              금융 소식
            </CardTitle>
            <a
              href={DEFAULT_X_LIST_PUBLIC_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              X에서 더 보기 &rarr;
            </a>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading && <NewsSkeleton />}
          {(isError || (!isLoading && (!tweets || tweets.length === 0))) && <ErrorFallback />}
          {tweets && tweets.length > 0 && (
            <div
              data-testid="news-list"
              style={{ maxHeight: 600, overflowY: 'auto' }}
            >
              {tweets.map(tweet => (
                <TweetCard key={tweet.id} tweet={tweet} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  )
}
