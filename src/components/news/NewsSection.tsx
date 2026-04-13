import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import { ExternalLink } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useFinancialNews } from '@/hooks/useFinancialNews'
import { DEFAULT_NEWS_PUBLIC_URL } from '@/constants/newsDefaults'
import type { NewsItem } from '@/types/news'

function NewsSkeleton() {
  return (
    <div className="space-y-3" data-testid="news-skeleton">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/3" />
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
        뉴스를 불러올 수 없습니다.
        <br />
        잠시 후 다시 시도해 주세요.
      </p>
      <a
        href={DEFAULT_NEWS_PUBLIC_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-muted/50 border border-border/40 text-sm font-medium text-foreground hover:bg-muted transition-colors"
      >
        구글 뉴스에서 직접 보기
        <span aria-hidden="true">&rarr;</span>
      </a>
    </div>
  )
}

function NewsCard({ item }: { item: NewsItem }) {
  const parsed = item.pubDate ? new Date(item.pubDate) : null
  const timeAgo =
    parsed && !Number.isNaN(parsed.getTime())
      ? formatDistanceToNow(parsed, { addSuffix: true, locale: ko })
      : ''

  return (
    <article
      className="py-3 border-b border-border/40 last:border-b-0"
      data-testid={`news-item-${item.id}`}
    >
      <a
        href={item.link}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${item.title} — ${item.source || '외부 링크'}`}
        className="block text-sm text-foreground/90 font-medium line-clamp-2 hover:text-foreground transition-colors"
      >
        {item.title}
      </a>
      <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
        {item.source && (
          <span className="px-2 py-0.5 rounded bg-muted/50 border border-border/30 font-medium">
            {item.source}
          </span>
        )}
        {timeAgo && <span>{timeAgo}</span>}
      </div>
    </article>
  )
}

export default function NewsSection() {
  const { data: news, isLoading, isError } = useFinancialNews()

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
              href={DEFAULT_NEWS_PUBLIC_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              구글 뉴스에서 더 보기
              <ExternalLink className="h-3 w-3" aria-hidden="true" />
            </a>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading && <NewsSkeleton />}
          {(isError || (!isLoading && (!news || news.length === 0))) && <ErrorFallback />}
          {news && news.length > 0 && (
            <div
              data-testid="news-list"
              style={{ maxHeight: 600, overflowY: 'auto' }}
            >
              {news.map(item => (
                <NewsCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  )
}
