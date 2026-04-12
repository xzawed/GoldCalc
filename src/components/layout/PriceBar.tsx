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

/** 이전 데이터 사용 중임을 알리는 배지 */
function StaleBadge({ cachedAt }: { cachedAt?: string }) {
  const date = cachedAt
    ? new Date(cachedAt).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })
    : null
  return (
    <span
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-orange-500/15 text-orange-400 border border-orange-500/25"
      title="API 한도 초과로 마지막 수신 데이터를 표시합니다"
    >
      <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
      이전 데이터{date ? ` (${date})` : ''}
    </span>
  )
}

export function PriceBar({ activeTab }: PriceBarProps) {
  const tabConfig = ASSET_TABS.find((t) => t.key === activeTab) ?? ASSET_TABS[0]
  const isDomestic = tabConfig.source === 'domestic'

  const { data: goldData, isLoading: goldLoading } = useGoldPrice()
  const { data: silverData, isLoading: silverLoading } = useSilverPrice()
  const { data: rateData, isLoading: rateLoading } = useExchangeRate()
  const { data: domesticData, isLoading: domesticLoading } = useDomesticGoldPrice()

  const skeletonBar = (
    <div className="border-b border-border/50 bg-muted/20 px-4 py-3">
      <div className="container mx-auto max-w-5xl flex gap-6">
        <Skeleton className="h-6 w-52" />
        <Skeleton className="h-6 w-32" />
      </div>
    </div>
  )

  if (isDomestic) {
    if (domesticLoading) return skeletonBar
    if (!domesticData) return null

    const changeColor = getChangeColor(domesticData.changePercent ?? 0)
    return (
      <div className="border-b border-border/50 bg-gradient-to-r from-amber-500/5 to-transparent px-4 py-3 text-sm" data-testid="price-bar">
        <div className="container mx-auto max-w-5xl flex flex-wrap gap-x-5 gap-y-1 items-center">
          <div className="flex items-baseline gap-2">
            <span className="text-xs text-muted-foreground">국내금</span>
            <span className="text-lg font-bold price-num text-foreground" data-testid="price-krw">
              {formatKRW(domesticData.priceKRW)}
              <span className="text-xs text-muted-foreground font-normal ml-1">/g</span>
            </span>
          </div>
          {domesticData.changePercent !== undefined && domesticData.changePercent !== 0 && (
            <span className={`text-sm font-medium price-num ${changeColor}`} data-testid="price-change">
              <span aria-hidden="true">{getChangeIcon(domesticData.changePercent)}</span>{' '}
              {formatChangeRate(domesticData.changePercent)}
            </span>
          )}
          {domesticData.isStale && <StaleBadge cachedAt={domesticData.cachedAt} />}
          <span className="text-muted-foreground text-xs ml-auto">KRX 금시장 기준</span>
        </div>
      </div>
    )
  }

  const metalData = tabConfig.metal === 'gold' ? goldData : silverData
  const isLoading = (tabConfig.metal === 'gold' ? goldLoading : silverLoading) || rateLoading

  if (isLoading) return skeletonBar
  if (!metalData || !rateData) return null

  const metalName = METAL_LABELS[tabConfig.metal]
  const defaultPurityRatio = tabConfig.metal === 'gold' ? 0.9999 : 0.999
  const priceKRWPerGram = Math.round(calcPricePerGram(metalData.priceUSD, rateData.exchangeRate) * defaultPurityRatio)
  const changeColor = getChangeColor(metalData.changePercent ?? 0)
  const isGold = tabConfig.metal === 'gold'
  const isStale = metalData.isStale || rateData.isStale
  const staleCachedAt = metalData.cachedAt ?? rateData.cachedAt

  return (
    <div
      className={`border-b border-border/50 bg-gradient-to-r ${isGold ? 'from-amber-500/5' : 'from-slate-500/5'} to-transparent px-4 py-3 text-sm`}
      data-testid="price-bar"
    >
      <div className="container mx-auto max-w-5xl flex flex-wrap gap-x-5 gap-y-1 items-center">
        <div className="flex items-baseline gap-2">
          <span className="text-xs text-muted-foreground">{metalName}</span>
          <span className="text-lg font-bold price-num text-foreground" data-testid="price-krw">
            {formatKRW(priceKRWPerGram)}
            <span className="text-xs text-muted-foreground font-normal ml-1">/g</span>
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-muted-foreground">국제가</span>
          <span className="font-medium price-num" data-testid="price-usd">{formatUSD(metalData.priceUSD)}/oz</span>
        </div>

        {metalData.changePercent !== undefined && (
          <span
            className={`text-sm font-medium price-num ${changeColor}`}
            data-testid="price-change"
            aria-label={`전일 대비 ${formatChangeRate(metalData.changePercent)}`}
          >
            <span aria-hidden="true">{getChangeIcon(metalData.changePercent)}</span>{' '}
            {formatChangeRate(metalData.changePercent)}
          </span>
        )}

        {isStale && <StaleBadge cachedAt={staleCachedAt} />}

        <span className="text-muted-foreground text-xs ml-auto hidden sm:block price-num">
          ₩{rateData.exchangeRate.toLocaleString('ko-KR')}/USD
          {rateData.isStale && <span className="ml-1 text-orange-400/70">(이전)</span>}
        </span>
      </div>
    </div>
  )
}
