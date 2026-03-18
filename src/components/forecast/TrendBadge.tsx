import { Badge } from '@/components/ui/badge'

interface TrendBadgeProps {
  trend: 'bullish' | 'bearish' | 'neutral'
}

const TREND_CONFIG = {
  bullish: { label: '▲ 상승세', className: 'bg-red-500 hover:bg-red-600 text-white' },
  bearish: { label: '▼ 하락세', className: 'bg-blue-500 hover:bg-blue-600 text-white' },
  neutral: { label: '─ 보합세', className: 'bg-gray-500 hover:bg-gray-600 text-white' },
}

export function TrendBadge({ trend }: TrendBadgeProps) {
  const config = TREND_CONFIG[trend]
  return (
    <Badge className={config.className} data-testid="trend-badge" aria-label={`트렌드: ${config.label}`}>
      {config.label}
    </Badge>
  )
}
