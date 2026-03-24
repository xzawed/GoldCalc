import { formatKRW, getChangeColor, getChangeIcon, formatChangeRate } from '@/utils/format'
import type { WeightUnit, Purity, Metal } from '@/types/gold'
import { calcPricePerGram, weightToGrams, PURITY_RATIO, METAL_LABELS } from '@/utils/metalCalc'

interface PriceDisplayProps {
  metal: Metal
  weight: number
  unit: WeightUnit
  purity: Purity
  priceUSD: number
  exchangeRate: number
  changePercent?: number
  updatedAt?: string
}

export function PriceDisplay({ metal, weight, unit, purity, priceUSD, exchangeRate, changePercent, updatedAt }: PriceDisplayProps) {
  const pricePerGram = calcPricePerGram(priceUSD, exchangeRate)
  const grams = weightToGrams(weight, unit)
  const totalKRW = Math.round(pricePerGram * grams * PURITY_RATIO[purity])
  const pricePerGramKRW = Math.round(pricePerGram * PURITY_RATIO[purity])
  const pricePerDonKRW = Math.round(pricePerGram * 3.75 * PURITY_RATIO[purity])

  const metalName = METAL_LABELS[metal]
  const unitLabel = unit === 'g' ? 'g' : unit === 'don' ? '돈' : '냥'
  const isGold = metal === 'gold'

  return (
    <div className="space-y-3 pt-2" data-testid="price-display">
      {/* 메인 결과 카드 */}
      <div
        className={`relative overflow-hidden rounded-xl border ${
          isGold ? 'border-amber-500/20 bg-amber-500/[0.06]' : 'border-slate-500/20 bg-slate-500/[0.06]'
        } px-5 py-5 text-center`}
      >
        <p className="text-xs text-muted-foreground mb-1.5">
          {weight || 0}{unitLabel} {purity} {metalName} 기준
        </p>
        <p
          className={`text-4xl font-bold tracking-tight price-num ${isGold ? 'text-amber-400' : 'text-slate-300'}`}
          data-testid="total-price"
          aria-live="polite"
        >
          {weight > 0 ? formatKRW(totalKRW) : '—'}
        </p>
        {changePercent !== undefined && (
          <p
            className={`text-sm mt-2 font-medium price-num ${getChangeColor(changePercent)}`}
            aria-label={`전일 대비 ${formatChangeRate(changePercent)}`}
          >
            <span aria-hidden="true">{getChangeIcon(changePercent)}</span>{' '}
            {formatChangeRate(changePercent)}
          </p>
        )}
      </div>

      {/* 단가 정보 */}
      <div className="grid grid-cols-2 gap-2.5 text-sm">
        <div className="bg-muted/30 rounded-xl p-3.5 text-center border border-border/40">
          <p className="text-xs text-muted-foreground mb-1">{metalName} 1g ({purity})</p>
          <p className="font-semibold price-num" data-testid="price-per-gram">{formatKRW(pricePerGramKRW)}</p>
        </div>
        <div className="bg-muted/30 rounded-xl p-3.5 text-center border border-border/40">
          <p className="text-xs text-muted-foreground mb-1">{metalName} 1돈 ({purity})</p>
          <p className="font-semibold price-num" data-testid="price-per-don">{formatKRW(pricePerDonKRW)}</p>
        </div>
      </div>

      {/* 기준 정보 */}
      <div className="grid grid-cols-2 gap-2.5 text-xs text-muted-foreground">
        <div className="bg-muted/20 rounded-lg px-3 py-2 text-center">
          국제가: <span className="price-num font-medium">${priceUSD.toFixed(2)}/oz</span>
        </div>
        <div className="bg-muted/20 rounded-lg px-3 py-2 text-center">
          환율: <span className="price-num font-medium">₩{exchangeRate.toLocaleString('ko-KR')}/USD</span>
        </div>
      </div>

      {updatedAt && (
        <p className="text-xs text-muted-foreground/60 text-center">
          기준 시각: {new Date(updatedAt).toLocaleString('ko-KR')}
        </p>
      )}
    </div>
  )
}
