import { useGoldPrice } from '@/hooks/useGoldPrice'
import { useSilverPrice } from '@/hooks/useSilverPrice'
import { useExchangeRate } from '@/hooks/useExchangeRate'
import { useDomesticGoldPrice } from '@/hooks/useDomesticGoldPrice'
import { calcPricePerGram, METAL_LABELS } from '@/utils/metalCalc'
import { formatKRW, formatUSD, formatChangeRate, getChangeColor, getChangeIcon } from '@/utils/format'
import { Skeleton } from '@/components/ui/skeleton'
import { ASSET_TABS } from '@/types/gold'
import type { AssetTab } from '@/types/gold'

interface PriceBarProps {
  activeTab: AssetTab
}

export function PriceBar({ activeTab }: PriceBarProps) {
  const tabConfig = ASSET_TABS.find((t) => t.key === activeTab)!
  const isDomestic = tabConfig.source === 'domestic'

  const { data: goldData, isLoading: goldLoading } = useGoldPrice()
  const { data: silverData, isLoading: silverLoading } = useSilverPrice()
  const { data: rateData, isLoading: rateLoading } = useExchangeRate()
  const { data: domesticData, isLoading: domesticLoading } = useDomesticGoldPrice()

  if (isDomestic) {
    if (domesticLoading) {
      return (
        <div className="bg-muted/40 border-b px-4 py-2">
          <div className="container mx-auto max-w-5xl flex gap-6">
            <Skeleton className="h-5 w-48" />
          </div>
        </div>
      )
    }

    if (!domesticData) return null

    const changeColor = getChangeColor(domesticData.changePercent ?? 0)

    return (
      <div className="bg-muted/40 border-b px-4 py-2 text-sm" data-testid="price-bar">
        <div className="container mx-auto max-w-5xl flex flex-wrap gap-x-6 gap-y-1 items-center">
          <span className="font-medium">
            국내금 현재가:{' '}
            <span className="text-foreground font-bold" data-testid="price-krw">
              {formatKRW(domesticData.priceKRW)}
              <span className="text-xs text-muted-foreground ml-1">/g</span>
            </span>
          </span>
          {domesticData.changePercent !== undefined && domesticData.changePercent !== 0 && (
            <span className={changeColor} data-testid="price-change">
              <span aria-hidden="true">{getChangeIcon(domesticData.changePercent)}</span>{' '}
              {formatChangeRate(domesticData.changePercent)}
            </span>
          )}
          <span className="text-muted-foreground text-xs ml-auto">KRX 금시장 기준</span>
        </div>
      </div>
    )
  }

  // 국제 금/은
  const metalData = tabConfig.metal === 'gold' ? goldData : silverData
  const isLoading = (tabConfig.metal === 'gold' ? goldLoading : silverLoading) || rateLoading

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

  if (!metalData || !rateData) return null

  const metalName = METAL_LABELS[tabConfig.metal]
  const defaultPurityRatio = tabConfig.metal === 'gold' ? 0.9999 : 0.999
  const priceKRWPerGram = Math.round(calcPricePerGram(metalData.priceUSD, rateData.exchangeRate) * defaultPurityRatio)
  const changeColor = getChangeColor(metalData.changePercent ?? 0)

  return (
    <div className="bg-muted/40 border-b px-4 py-2 text-sm" data-testid="price-bar">
      <div className="container mx-auto max-w-5xl flex flex-wrap gap-x-6 gap-y-1 items-center">
        <span className="font-medium">
          {metalName} 현재가:{' '}
          <span className="text-foreground font-bold" data-testid="price-krw">
            {formatKRW(priceKRWPerGram)}
            <span className="text-xs text-muted-foreground ml-1">/g</span>
          </span>
        </span>
        <span className="text-muted-foreground">
          국제가: <span data-testid="price-usd">{formatUSD(metalData.priceUSD)}</span>/oz
        </span>
        {metalData.changePercent !== undefined && (
          <span className={changeColor} data-testid="price-change" aria-label={`전일 대비 ${formatChangeRate(metalData.changePercent)}`}>
            <span aria-hidden="true">{getChangeIcon(metalData.changePercent)}</span>{' '}
            {formatChangeRate(metalData.changePercent)}
          </span>
        )}
        <span className="text-muted-foreground text-xs ml-auto">
          환율: ₩{rateData.exchangeRate.toLocaleString('ko-KR')}/USD
        </span>
      </div>
    </div>
  )
}
