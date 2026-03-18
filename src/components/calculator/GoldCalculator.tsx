import { useState } from 'react'
import { useGoldPrice } from '@/hooks/useGoldPrice'
import { useExchangeRate } from '@/hooks/useExchangeRate'
import { UnitSelector } from './UnitSelector'
import { PuritySelector } from './PuritySelector'
import { PriceDisplay } from './PriceDisplay'
import { Input } from '@/components/ui/input'
import { ErrorAlert } from '@/components/common/ErrorAlert'
import { Skeleton } from '@/components/ui/skeleton'
import type { WeightUnit, Purity } from '@/types/gold'

export default function GoldCalculator() {
  const [weight, setWeight] = useState<number>(0)
  const [unit, setUnit] = useState<WeightUnit>('don')
  const [purity, setPurity] = useState<Purity>('24K')

  const { data: goldData, isLoading: goldLoading, isError: goldError } = useGoldPrice()
  const { data: rateData, isLoading: rateLoading, isError: rateError } = useExchangeRate()

  const isLoading = goldLoading || rateLoading
  const isError = goldError || rateError

  const handleWeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value)
    setWeight(isNaN(val) ? 0 : val)
  }

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
    <div className="space-y-4" data-testid="gold-calculator">
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
          aria-label="금 무게 입력"
        />
      </div>
      <div className="space-y-2">
        <p className="text-sm font-medium">단위 선택</p>
        <UnitSelector value={unit} onChange={setUnit} />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">순도 선택</label>
        <PuritySelector value={purity} onChange={setPurity} />
      </div>
      {goldData && rateData && (
        <PriceDisplay
          weight={weight}
          unit={unit}
          purity={purity}
          priceUSD={goldData.priceUSD}
          exchangeRate={rateData.exchangeRate}
          changePercent={goldData.changePercent}
          updatedAt={goldData.updatedAt}
        />
      )}
    </div>
  )
}
