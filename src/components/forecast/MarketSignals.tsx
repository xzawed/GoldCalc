import { Card, CardContent } from '@/components/ui/card'
import { getChangeColor, getChangeIcon } from '@/utils/format'
import type { MarketSignal } from '@/types/gold'

interface MarketSignalsProps {
  signals: MarketSignal[]
}

const trendToRate = (trend: MarketSignal['trend']): number =>
  trend === 'up' ? 1 : trend === 'down' ? -1 : 0

export const MarketSignals = ({ signals }: MarketSignalsProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" data-testid="market-signals">
      {signals.map((signal) => {
        const rate = trendToRate(signal.trend)
        const color = getChangeColor(rate)
        return (
          <Card key={signal.name} className="p-3">
            <CardContent className="p-0">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-medium">{signal.name}</p>
                <span className={`text-sm font-semibold ${color}`} aria-label={`${signal.name} 트렌드: ${signal.trend}`}>
                  <span aria-hidden="true">{getChangeIcon(rate)}</span>{' '}
                  {signal.value > 0 ? signal.value.toFixed(2) : '—'}
                </span>
              </div>
              {signal.description && (
                <p className="text-xs text-muted-foreground">{signal.description}</p>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
