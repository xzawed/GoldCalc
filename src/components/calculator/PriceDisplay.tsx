import { formatKRW, getChangeColor, getChangeIcon, formatChangeRate } from '@/utils/format'
import type { WeightUnit, Purity } from '@/types/gold'
import { calcPricePerGram, weightToGrams, PURITY_RATIO } from '@/utils/goldCalc'

interface PriceDisplayProps {
  weight: number
  unit: WeightUnit
  purity: Purity
  priceUSD: number
  exchangeRate: number
  changePercent?: number
  updatedAt?: string
}

export function PriceDisplay({ weight, unit, purity, priceUSD, exchangeRate, changePercent, updatedAt }: PriceDisplayProps) {
  const pricePerGram = calcPricePerGram(priceUSD, exchangeRate)
  const grams = weightToGrams(weight, unit)
  const totalKRW = Math.round(pricePerGram * grams * PURITY_RATIO[purity])
  const pricePerGramKRW = Math.round(pricePerGram * PURITY_RATIO[purity])
  const pricePerDonKRW = Math.round(pricePerGram * 3.75 * PURITY_RATIO[purity])

  return (
    <div className="space-y-4" data-testid="price-display">
      <div className="text-center py-4 bg-muted/30 rounded-lg">
        <p className="text-sm text-muted-foreground mb-1">
          {weight || 0}{unit === 'g' ? 'g' : unit === 'don' ? '돈' : '냥'} {purity} 기준
        </p>
        <p className="text-4xl font-bold tracking-tight" data-testid="total-price" aria-live="polite">
          {weight > 0 ? formatKRW(totalKRW) : '—'}
        </p>
        {changePercent !== undefined && (
          <p className={`text-sm mt-1 ${getChangeColor(changePercent)}`} aria-label={`전일 대비 ${formatChangeRate(changePercent)}`}>
            <span aria-hidden="true">{getChangeIcon(changePercent)}</span>{' '}
            {formatChangeRate(changePercent)}
          </p>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="bg-muted/20 rounded p-3 text-center">
          <p className="text-muted-foreground">1g ({purity})</p>
          <p className="font-semibold" data-testid="price-per-gram">{formatKRW(pricePerGramKRW)}</p>
        </div>
        <div className="bg-muted/20 rounded p-3 text-center">
          <p className="text-muted-foreground">1돈 ({purity})</p>
          <p className="font-semibold" data-testid="price-per-don">{formatKRW(pricePerDonKRW)}</p>
        </div>
      </div>
      {updatedAt && (
        <p className="text-xs text-muted-foreground text-center">
          기준 시각: {new Date(updatedAt).toLocaleString('ko-KR')}
        </p>
      )}
    </div>
  )
}
