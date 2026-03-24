import { memo, useMemo } from 'react'
import { formatKRW, formatUSD, formatChangeRate, getChangeColor, getChangeIcon, formatDate } from '@/utils/format'
import { addChangeRates } from '@/utils/historyCalc'
import type { HistoryEntry } from '@/types/gold'

interface PriceTableProps {
  entries: HistoryEntry[]
  metalName?: string
}

export const PriceTable = memo(function PriceTable({ entries, metalName = '금' }: PriceTableProps) {
  const entriesWithChange = useMemo(() => addChangeRates([...entries].reverse()), [entries])

  return (
    <div className="overflow-x-auto rounded-xl border border-border/40" data-testid="price-table">
      <table className="w-full text-sm" role="table" aria-label={`날짜별 ${metalName}시세`}>
        <thead>
          <tr className="border-b border-border/40 bg-muted/30">
            <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">날짜</th>
            <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground hidden sm:table-cell">USD/oz</th>
            <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">원화/g</th>
            <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">전일 대비</th>
          </tr>
        </thead>
        <tbody>
          {entriesWithChange.map((entry) => {
            const changeColor = entry.changeRate !== undefined ? getChangeColor(entry.changeRate) : ''
            return (
              <tr key={entry.date} className="border-b border-border/30 last:border-0 hover:bg-muted/20 transition-colors">
                <td className="px-4 py-2.5 text-sm text-muted-foreground">{formatDate(entry.date)}</td>
                <td className="px-4 py-2.5 text-right price-num hidden sm:table-cell">{formatUSD(entry.priceUSD)}</td>
                <td className="px-4 py-2.5 text-right price-num font-medium">{formatKRW(entry.priceKRW)}</td>
                <td className={`px-4 py-2.5 text-right price-num text-sm ${changeColor}`}>
                  {entry.changeRate !== undefined ? (
                    <span aria-label={`전일 대비 ${formatChangeRate(entry.changeRate)}`}>
                      <span aria-hidden="true">{getChangeIcon(entry.changeRate)}</span>{' '}
                      {formatChangeRate(entry.changeRate)}
                    </span>
                  ) : <span className="text-muted-foreground/40">—</span>}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
})
