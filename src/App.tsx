import { Suspense, lazy, useState } from 'react'
import { Header } from '@/components/layout/Header'
import { PriceBar } from '@/components/layout/PriceBar'
import { Footer } from '@/components/layout/Footer'
import { OfflineBanner } from '@/components/layout/OfflineBanner'
import { AssetNav } from '@/components/layout/AssetNav'
import { Skeleton } from '@/components/ui/skeleton'
import type { AssetTab } from '@/types/gold'
import { ASSET_TABS } from '@/types/gold'

const CalculatorSection = lazy(() => import('@/components/calculator/CalculatorSection'))
const HistorySection = lazy(() => import('@/components/history/HistorySection'))
const ForecastSection = lazy(() => import('@/components/forecast/ForecastSection'))
const DomesticGoldSection = lazy(() => import('@/components/domestic/DomesticGoldSection'))

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

  const tabConfig = ASSET_TABS.find((t) => t.key === activeTab)!
  const isDomestic = tabConfig.source === 'domestic'

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <OfflineBanner />
      <Header />
      <PriceBar activeTab={activeTab} />
      <AssetNav activeTab={activeTab} onChange={setActiveTab} />
      <main className="flex-1 container mx-auto max-w-5xl px-4 py-6 space-y-8">
        {isDomestic ? (
          <Suspense fallback={<SectionSkeleton />}>
            <DomesticGoldSection />
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
      </main>
      <Footer />
    </div>
  )
}
