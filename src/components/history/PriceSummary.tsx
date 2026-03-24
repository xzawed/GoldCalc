import { formatKRW, formatDate } from '@/utils/format'
import type { PeriodSummary } from '@/types/gold'

interface PriceSummaryProps {
  summary: PeriodSummary
}

export function PriceSummary({ summary }: PriceSummaryProps) {
  const items = [
    {
      label: '최고',
      price: summary.highest.priceKRW,
      date: summary.highest.date,
      testId: 'summary-highest',
      color: 'text-red-400',
      bg: 'bg-red-500/10 border-red-500/20',
    },
    {
      label: '최저',
      price: summary.lowest.priceKRW,
      date: summary.lowest.date,
      testId: 'summary-lowest',
      color: 'text-blue-400',
      bg: 'bg-blue-500/10 border-blue-500/20',
    },
    {
      label: '평균',
      price: summary.averageKRW,
      date: null,
      testId: 'summary-average',
      color: 'text-foreground',
      bg: 'bg-muted/40 border-border/40',
    },
  ]

  return (
    <div className="grid grid-cols-3 gap-2.5" data-testid="price-summary">
      {items.map((item) => (
        <div key={item.label} className={`rounded-xl border px-3 py-2.5 ${item.bg}`}>
          <p className="text-xs text-muted-foreground mb-0.5">{item.label}</p>
          <p className={`font-bold text-sm price-num ${item.color}`} data-testid={item.testId}>
            {formatKRW(item.price)}<span className="text-xs font-normal text-muted-foreground">/g</span>
          </p>
          <p className="text-xs text-muted-foreground/70 mt-0.5">
            {item.date ? formatDate(item.date) : '기간 평균'}
          </p>
        </div>
      ))}
    </div>
  )
}
