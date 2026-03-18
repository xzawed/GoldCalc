import { Suspense, lazy } from 'react'
import { Header } from '@/components/layout/Header'
import { PriceBar } from '@/components/layout/PriceBar'
import { Footer } from '@/components/layout/Footer'
import { OfflineBanner } from '@/components/layout/OfflineBanner'
import { Skeleton } from '@/components/ui/skeleton'

const CalculatorSection = lazy(() => import('@/components/calculator/CalculatorSection'))
const HistorySection = lazy(() => import('@/components/history/HistorySection'))
const ForecastSection = lazy(() => import('@/components/forecast/ForecastSection'))

function SectionSkeleton() {
  return (
    <div className="space-y-3 p-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-64 w-full" />
    </div>
  )
}

export default function App() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <OfflineBanner />
      <Header />
      <PriceBar />
      <main className="flex-1 container mx-auto max-w-5xl px-4 py-6 space-y-8">
        <Suspense fallback={<SectionSkeleton />}>
          <CalculatorSection />
        </Suspense>
        <Suspense fallback={<SectionSkeleton />}>
          <HistorySection />
        </Suspense>
        <Suspense fallback={<SectionSkeleton />}>
          <ForecastSection />
        </Suspense>
      </main>
      <Footer />
    </div>
  )
}
