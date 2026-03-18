import { Badge } from '@/components/ui/badge'
import { formatKRW, formatDate } from '@/utils/format'
import type { PeriodSummary } from '@/types/gold'

interface PriceSummaryProps {
  summary: PeriodSummary
}

export function PriceSummary({ summary }: PriceSummaryProps) {
  return (
    <div className="flex flex-wrap gap-3" data-testid="price-summary">
      <div className="flex items-center gap-2 rounded-lg border px-3 py-2">
        <Badge variant="destructive" className="text-xs">최고</Badge>
        <div>
          <p className="font-semibold text-sm" data-testid="summary-highest">{formatKRW(summary.highest.priceKRW)}/g</p>
          <p className="text-xs text-muted-foreground">{formatDate(summary.highest.date)}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 rounded-lg border px-3 py-2">
        <Badge className="text-xs bg-blue-500 hover:bg-blue-600">최저</Badge>
        <div>
          <p className="font-semibold text-sm" data-testid="summary-lowest">{formatKRW(summary.lowest.priceKRW)}/g</p>
          <p className="text-xs text-muted-foreground">{formatDate(summary.lowest.date)}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 rounded-lg border px-3 py-2">
        <Badge variant="secondary" className="text-xs">평균</Badge>
        <div>
          <p className="font-semibold text-sm" data-testid="summary-average">{formatKRW(summary.averageKRW)}/g</p>
          <p className="text-xs text-muted-foreground">기간 평균</p>
        </div>
      </div>
    </div>
  )
}
