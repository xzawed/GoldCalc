import { Suspense, lazy, useState, useEffect } from 'react'
import { Header } from '@/components/layout/Header'
import { PriceBar } from '@/components/layout/PriceBar'
import { Footer } from '@/components/layout/Footer'
import { OfflineBanner } from '@/components/layout/OfflineBanner'
import { AssetNav } from '@/components/layout/AssetNav'
import { Skeleton } from '@/components/ui/skeleton'
import { useApiAvailability } from '@/hooks/useApiAvailability'
import type { AssetTab } from '@/types/gold'
import { ASSET_TABS } from '@/types/gold'

const CalculatorSection = lazy(() => import('@/components/calculator/CalculatorSection'))
const HistorySection = lazy(() => import('@/components/history/HistorySection'))
const ForecastSection = lazy(() => import('@/components/forecast/ForecastSection'))
const DomesticGoldSection = lazy(() => import('@/components/domestic/DomesticGoldSection'))
const DomesticSilverSection = lazy(() => import('@/components/domestic/DomesticSilverSection'))
const NewsSection = lazy(() => import('@/components/news/NewsSection'))

function SectionSkeleton() {
  return (
    <div className="space-y-3 p-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-64 w-full" />
    </div>
  )
}

export default function App() {
  const [activeTab, setActiveTab] = useState<AssetTab>('intl-gold')
  const availability = useApiAvailability()

  // 현재 활성 탭이 사용 불가 상태가 되면 첫 번째 가용 탭으로 자동 전환
  useEffect(() => {
    if (availability[activeTab] === false) {
      const fallback = ASSET_TABS.find((t) => availability[t.key] !== false)
      if (fallback) setActiveTab(fallback.key)
    }
  }, [availability, activeTab])

  const tabConfig = ASSET_TABS.find((t) => t.key === activeTab) ?? ASSET_TABS[0]

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative">
      {/* 배경 그라디언트 */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-amber-500/[0.06] blur-3xl" />
        <div className="absolute top-0 right-0 w-[400px] h-[300px] rounded-full bg-amber-600/[0.04] blur-3xl" />
      </div>

      <OfflineBanner />
      <Header />
      <PriceBar activeTab={activeTab} />
      <AssetNav activeTab={activeTab} onChange={setActiveTab} availability={availability} />

      <main className="flex-1 container mx-auto max-w-5xl px-4 py-6 space-y-6">
        {activeTab === 'domestic-gold' ? (
          <Suspense fallback={<SectionSkeleton />}>
            <DomesticGoldSection />
          </Suspense>
        ) : activeTab === 'domestic-silver' ? (
          <Suspense fallback={<SectionSkeleton />}>
            <DomesticSilverSection />
          </Suspense>
        ) : (
          <>
            <Suspense fallback={<SectionSkeleton />}>
              <CalculatorSection metal={tabConfig.metal} />
            </Suspense>
            <Suspense fallback={<SectionSkeleton />}>
              <HistorySection metal={tabConfig.metal} />
            </Suspense>
            <Suspense fallback={<SectionSkeleton />}>
              <ForecastSection metal={tabConfig.metal} />
            </Suspense>
          </>
        )}

        <Suspense fallback={<SectionSkeleton />}>
          <NewsSection />
        </Suspense>
      </main>

      <Footer />
    </div>
  )
}
