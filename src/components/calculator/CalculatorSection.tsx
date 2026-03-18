import { lazy, Suspense } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

const GoldCalculator = lazy(() => import('./GoldCalculator'))

export default function CalculatorSection() {
  return (
    <section aria-labelledby="calculator-title" data-testid="calculator-section">
      <Card>
        <CardHeader>
          <CardTitle id="calculator-title">금 시세 계산기</CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<Skeleton className="h-48 w-full" />}>
            <GoldCalculator />
          </Suspense>
        </CardContent>
      </Card>
    </section>
  )
}
