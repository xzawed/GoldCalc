import { lazy, Suspense } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { Metal } from '@/types/gold'
import { METAL_LABELS } from '@/utils/metalCalc'

const MetalCalculator = lazy(() => import('./MetalCalculator'))

interface CalculatorSectionProps {
  metal?: Metal
}

export default function CalculatorSection({ metal = 'gold' }: CalculatorSectionProps) {
  return (
    <section aria-labelledby="calculator-title" data-testid="calculator-section">
      <Card>
        <CardHeader>
          <CardTitle id="calculator-title">{METAL_LABELS[metal]} 시세 계산기</CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<Skeleton className="h-48 w-full" />}>
            <MetalCalculator metal={metal} />
          </Suspense>
        </CardContent>
      </Card>
    </section>
  )
}
