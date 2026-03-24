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
  const isGold = metal === 'gold'
  return (
    <section aria-labelledby="calculator-title" data-testid="calculator-section">
      <Card className={`overflow-hidden ${isGold ? 'card-glow-gold' : 'card-glow-silver'}`}>
        <CardHeader className="pb-3">
          <CardTitle id="calculator-title" className="flex items-center gap-2 text-base">
            <span
              className={`w-1.5 h-5 rounded-full ${isGold ? 'bg-amber-400' : 'bg-slate-400'}`}
              aria-hidden="true"
            />
            {METAL_LABELS[metal]} 시세 계산기
          </CardTitle>
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
