import { useState } from 'react'
import { useGoldPrice } from '@/hooks/useGoldPrice'
import { useSilverPrice } from '@/hooks/useSilverPrice'
import { useExchangeRate } from '@/hooks/useExchangeRate'
import { UnitSelector } from './UnitSelector'
import { PuritySelector } from './PuritySelector'
import { PriceDisplay } from './PriceDisplay'
import { Input } from '@/components/ui/input'
import { ErrorAlert } from '@/components/common/ErrorAlert'
import { Skeleton } from '@/components/ui/skeleton'
import { DEFAULT_PURITY, METAL_LABELS } from '@/utils/metalCalc'
import type { WeightUnit, Purity, Metal } from '@/types/gold'

interface MetalCalculatorProps {
  metal: Metal
}

export default function MetalCalculator({ metal }: MetalCalculatorProps) {
  const [weight, setWeight] = useState<number>(0)
  const [unit, setUnit] = useState<WeightUnit>('don')
  const [purity, setPurity] = useState<Purity>(DEFAULT_PURITY[metal])

  const goldQuery = useGoldPrice({ enabled: metal === 'gold' })
  const silverQuery = useSilverPrice({ enabled: metal === 'silver' })
  const { data: rateData, isLoading: rateLoading, isError: rateError } = useExchangeRate()

  const priceQuery = metal === 'gold' ? goldQuery : silverQuery
  const isLoading = priceQuery.isLoading || rateLoading
  const isError = priceQuery.isError || rateError

  const handleWeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value)
    setWeight(isNaN(val) ? 0 : val)
  }

  // metal 변경 시 순도 초기화
  const handlePurityChange = (p: Purity) => setPurity(p)

  if (isLoading) {
    return (
      <div className="space-y-4" data-testid="calculator-skeleton">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-4" data-testid={metal === 'gold' ? 'gold-calculator' : 'silver-calculator'}>
      {isError && <ErrorAlert message="시세 데이터를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요." />}
      <div className="space-y-2">
        <label htmlFor="weight-input" className="text-sm font-medium">무게 입력</label>
        <Input
          id="weight-input"
          type="number"
          min={0}
          step={0.1}
          placeholder="무게를 입력하세요"
          value={weight || ''}
          onChange={handleWeightChange}
          data-testid="weight-input"
          aria-label={`${METAL_LABELS[metal]} 무게 입력`}
        />
      </div>
      <div className="space-y-2">
        <span id="unit-selector-label" className="text-sm font-medium block">단위 선택</span>
        <UnitSelector value={unit} onChange={setUnit} labelId="unit-selector-label" />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">순도 선택</label>
        <PuritySelector metal={metal} value={purity} onChange={handlePurityChange} />
      </div>
      {priceQuery.data && rateData && (
        <PriceDisplay
          metal={metal}
          weight={weight}
          unit={unit}
          purity={purity}
          priceUSD={priceQuery.data.priceUSD}
          exchangeRate={rateData.exchangeRate}
          changePercent={priceQuery.data.changePercent}
          updatedAt={priceQuery.data.updatedAt}
        />
      )}
    </div>
  )
}
