import { useRef, useEffect, useState, useCallback } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { loadXWidgets, renderXWidgets } from '@/utils/xWidgets'
import { DEFAULT_X_EMBED_URL, X_WIDGET_OPTIONS } from '@/constants/newsDefaults'

type LoadState = 'loading' | 'loaded' | 'error'

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
        X(Twitter) 타임라인을 불러올 수 없습니다.
        <br />
        네트워크 환경에 따라 X 임베드가 차단될 수 있습니다.
      </p>
      <a
        href={DEFAULT_X_EMBED_URL}
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

export default function NewsSection() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [state, setState] = useState<LoadState>('loading')

  const initWidget = useCallback(async () => {
    try {
      await loadXWidgets()

      // widgets.js 로드 후 twttr가 준비될 때까지 대기
      if (containerRef.current) {
        renderXWidgets(containerRef.current)
      }

      // 위젯 렌더링 확인: iframe이 생성되고 실제 콘텐츠가 로드되었는지 판단 (최대 10초 대기)
      let attempts = 0
      const check = setInterval(() => {
        attempts++
        const iframe = containerRef.current?.querySelector('iframe') as HTMLIFrameElement | null
        if (iframe && iframe.offsetHeight > 0) {
          setState('loaded')
          clearInterval(check)
        } else if (attempts >= 20) {
          // iframe이 있지만 콘텐츠 미로드, 또는 iframe 자체가 없는 경우
          setState(iframe ? 'loaded' : 'error')
          clearInterval(check)
        }
      }, 500)
    } catch (error) {
      console.error('[NewsSection] X 위젯 초기화 실패:', error)
      setState('error')
    }
  }, [])

  useEffect(() => {
    initWidget()
  }, [initWidget])

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
              href={DEFAULT_X_EMBED_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              X에서 더 보기 &rarr;
            </a>
          </div>
        </CardHeader>

        <CardContent>
          {state === 'error' ? (
            <ErrorFallback />
          ) : (
            <>
              {state === 'loading' && <NewsSkeleton />}
              <div
                ref={containerRef}
                className={state === 'loading' ? 'sr-only' : ''}
                style={{ maxHeight: X_WIDGET_OPTIONS.height, overflowY: 'auto' }}
              >
                <a
                  className="twitter-timeline"
                  href={DEFAULT_X_EMBED_URL}
                  data-height={X_WIDGET_OPTIONS.height}
                  data-theme={X_WIDGET_OPTIONS.theme}
                  data-chrome={X_WIDGET_OPTIONS.chrome}
                  data-lang={X_WIDGET_OPTIONS.lang}
                  data-tweet-limit={X_WIDGET_OPTIONS.tweetLimit}
                >
                  타임라인을 불러오는 중입니다
                </a>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </section>
  )
}
