import { memo, useMemo } from 'react'
import { formatKRW, formatUSD, formatChangeRate, getChangeColor, getChangeIcon, formatDate } from '@/utils/format'
import { addChangeRates } from '@/utils/historyCalc'
import type { HistoryEntry } from '@/types/gold'

interface PriceTableProps {
  entries: HistoryEntry[]
}

export const PriceTable = memo(function PriceTable({ entries }: PriceTableProps) {
  const entriesWithChange = useMemo(() => addChangeRates([...entries].reverse()), [entries])

  return (
    <div className="overflow-x-auto" data-testid="price-table">
      <table className="w-full text-sm" role="table" aria-label="날짜별 금시세">
        <thead>
          <tr className="border-b text-muted-foreground text-left">
            <th className="pb-2 pr-4 font-medium">날짜</th>
            <th className="pb-2 pr-4 font-medium text-right">국제금시세(USD/oz)</th>
            <th className="pb-2 pr-4 font-medium text-right">원화/g</th>
            <th className="pb-2 font-medium text-right">전일 대비</th>
          </tr>
        </thead>
        <tbody>
          {entriesWithChange.map((entry) => {
            const changeColor = entry.changeRate !== undefined ? getChangeColor(entry.changeRate) : ''
            return (
              <tr key={entry.date} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                <td className="py-2 pr-4">{formatDate(entry.date)}</td>
                <td className="py-2 pr-4 text-right">{formatUSD(entry.priceUSD)}</td>
                <td className="py-2 pr-4 text-right">{formatKRW(entry.priceKRW)}</td>
                <td className={`py-2 text-right ${changeColor}`}>
                  {entry.changeRate !== undefined ? (
                    <span aria-label={`전일 대비 ${formatChangeRate(entry.changeRate)}`}>
                      <span aria-hidden="true">{getChangeIcon(entry.changeRate)}</span>{' '}
                      {formatChangeRate(entry.changeRate)}
                    </span>
                  ) : '—'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
})
