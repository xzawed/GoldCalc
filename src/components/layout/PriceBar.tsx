import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/utils/api'
import { formatKRW, formatUSD, formatChangeRate, getChangeColor } from '@/utils/format'
import type { GoldPriceResponse } from '@/types/gold'
import { Skeleton } from '@/components/ui/skeleton'

function fetchCurrentPrice(): Promise<GoldPriceResponse> {
  return apiFetch<GoldPriceResponse>(
    `${import.meta.env.VITE_GOLD_API_URL}?apikey=${import.meta.env.VITE_GOLD_API_KEY}`
  )
}

export function PriceBar() {
  const { data, isLoading, isError } = useQuery<GoldPriceResponse>({
    queryKey: ['goldPrice', 'current'],
    queryFn: fetchCurrentPrice,
    staleTime: 60_000,
    refetchInterval: 60_000,
  })

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

  if (isError || !data) return null

  const changeColor = getChangeColor(data.changePercent ?? 0)

  return (
    <div className="bg-muted/40 border-b px-4 py-2 text-sm">
      <div className="container mx-auto max-w-5xl flex flex-wrap gap-x-6 gap-y-1 items-center">
        <span className="font-medium">
          금 현재가:{' '}
          <span className="text-foreground font-bold">
            {formatKRW(data.priceKRW ?? 0)}
            <span className="text-xs text-muted-foreground ml-1">/g</span>
          </span>
        </span>
        <span className="text-muted-foreground">
          국제가: {formatUSD(data.priceUSD ?? 0)}/oz
        </span>
        {data.changePercent !== undefined && (
          <span className={changeColor}>
            {formatChangeRate(data.changePercent)}
          </span>
        )}
        <span className="text-muted-foreground text-xs ml-auto">
          환율: ₩{data.exchangeRate?.toLocaleString() ?? '-'}/USD
        </span>
      </div>
    </div>
  )
}
