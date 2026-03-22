import {
  ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer
} from 'recharts'
import { formatKRW, formatUSD, formatDate } from '@/utils/format'
import type { HistoryEntry } from '@/types/gold'

interface PriceChartProps {
  entries: HistoryEntry[]
  metalName?: string
}

export function PriceChart({ entries, metalName = '금' }: PriceChartProps) {
  const data = entries.map(e => ({
    date: e.date,
    usd: e.priceUSD,
    krw: e.priceKRW,
  }))

  return (
    <div role="img" aria-label={`${metalName}시세 차트`} data-testid="price-chart">
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="date"
            tickFormatter={(v) => {
              const d = new Date(v)
              return `${d.getMonth() + 1}/${d.getDate()}`
            }}
            tick={{ fontSize: 11 }}
          />
          <YAxis
            yAxisId="usd"
            orientation="left"
            tickFormatter={(v) => `$${v.toLocaleString()}`}
            tick={{ fontSize: 11 }}
            width={70}
          />
          <YAxis
            yAxisId="krw"
            orientation="right"
            tickFormatter={(v) => `₩${(v / 1000).toFixed(0)}k`}
            tick={{ fontSize: 11 }}
            width={60}
          />
          <Tooltip
            formatter={(value: number, name: string) => {
              if (name === 'USD/oz') return [formatUSD(value), name]
              return [formatKRW(value) + '/g', name]
            }}
            labelFormatter={(label) => formatDate(label as string)}
          />
          <Legend />
          <Line
            yAxisId="usd"
            type="monotone"
            dataKey="usd"
            name="USD/oz"
            stroke="#f59e0b"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
          <Line
            yAxisId="krw"
            type="monotone"
            dataKey="krw"
            name="원화/g"
            stroke="#10b981"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
