import { useGoldPrice } from '@/hooks/useGoldPrice'
import { useExchangeRate } from '@/hooks/useExchangeRate'
import { calcPricePerGram } from '@/utils/goldCalc'
import { formatKRW, formatUSD, formatChangeRate, getChangeColor, getChangeIcon } from '@/utils/format'
import { Skeleton } from '@/components/ui/skeleton'

export function PriceBar() {
  const { data: goldData, isLoading: goldLoading } = useGoldPrice()
  const { data: rateData, isLoading: rateLoading } = useExchangeRate()

  const isLoading = goldLoading || rateLoading

  if (isLoading) {
    return (
      <div className="bg-muted/40 border-b px-4 py-2">
        <div className="container mx-auto max-w-5xl flex gap-6">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-5 w-32" />
        </div>
      </div>
    )
  }

  if (!goldData || !rateData) return null

  const priceKRWPerGram = Math.round(calcPricePerGram(goldData.priceUSD, rateData.exchangeRate) * 0.9999)
  const changeColor = getChangeColor(goldData.changePercent ?? 0)

  return (
    <div className="bg-muted/40 border-b px-4 py-2 text-sm" data-testid="price-bar">
      <div className="container mx-auto max-w-5xl flex flex-wrap gap-x-6 gap-y-1 items-center">
        <span className="font-medium">
          금 현재가:{' '}
          <span className="text-foreground font-bold" data-testid="price-krw">
            {formatKRW(priceKRWPerGram)}
            <span className="text-xs text-muted-foreground ml-1">/g</span>
          </span>
        </span>
        <span className="text-muted-foreground">
          국제가: <span data-testid="price-usd">{formatUSD(goldData.priceUSD)}</span>/oz
        </span>
        {goldData.changePercent !== undefined && (
          <span className={changeColor} data-testid="price-change" aria-label={`전일 대비 ${formatChangeRate(goldData.changePercent)}`}>
            <span aria-hidden="true">{getChangeIcon(goldData.changePercent)}</span>{' '}
            {formatChangeRate(goldData.changePercent)}
          </span>
        )}
        <span className="text-muted-foreground text-xs ml-auto">
          환율: ₩{rateData.exchangeRate.toLocaleString('ko-KR')}/USD
        </span>
      </div>
    </div>
  )
}
