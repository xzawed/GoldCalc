import {
  ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer
} from 'recharts'
import { formatKRW, formatUSD, formatDate } from '@/utils/format'
import type { HistoryEntry } from '@/types/gold'

interface PriceChartProps {
  entries: HistoryEntry[]
  metalName?: string
  metalColor?: string
}

const CustomTooltip = ({
  active, payload, label,
}: {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
}) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-border/60 bg-popover/95 backdrop-blur-sm px-3 py-2.5 shadow-xl text-sm">
      <p className="text-muted-foreground text-xs mb-2 font-medium">{label ? formatDate(label) : ''}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-muted-foreground text-xs">{p.name}:</span>
          <span className="font-semibold price-num text-xs">
            {p.name === 'USD/oz' ? formatUSD(p.value) : formatKRW(p.value) + '/g'}
          </span>
        </div>
      ))}
    </div>
  )
}

export function PriceChart({ entries, metalName = '금', metalColor }: PriceChartProps) {
  const isGold = metalName.includes('금')
  const primaryColor = metalColor ?? (isGold ? '#f5c518' : '#94a3b8')
  const secondaryColor = isGold ? '#34d399' : '#60a5fa'

  const data = entries.map(e => ({
    date: e.date,
    usd: e.priceUSD,
    krw: e.priceKRW,
  }))

  return (
    <div role="img" aria-label={`${metalName}시세 차트`} data-testid="price-chart">
      <ResponsiveContainer width="100%" height={260}>
        <ComposedChart data={data} margin={{ top: 8, right: 16, left: 4, bottom: 4 }}>
          <defs>
            <linearGradient id="lineGradientUsd" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={primaryColor} stopOpacity={0.8} />
              <stop offset="100%" stopColor={primaryColor} stopOpacity={1} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
          <XAxis
            dataKey="date"
            tickFormatter={(v) => {
              const d = new Date(v)
              return `${d.getMonth() + 1}/${d.getDate()}`
            }}
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={{ stroke: 'hsl(var(--border))' }}
            tickLine={false}
          />
          <YAxis
            yAxisId="usd"
            orientation="left"
            tickFormatter={(v) => `$${v.toLocaleString()}`}
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={false}
            tickLine={false}
            width={68}
          />
          <YAxis
            yAxisId="krw"
            orientation="right"
            tickFormatter={(v) => `₩${(v / 1000).toFixed(0)}k`}
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={false}
            tickLine={false}
            width={58}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
            formatter={(value) => <span style={{ color: 'hsl(var(--muted-foreground))' }}>{value}</span>}
          />
          <Line
            yAxisId="usd"
            type="monotone"
            dataKey="usd"
            name="USD/oz"
            stroke={primaryColor}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: primaryColor, strokeWidth: 0 }}
          />
          <Line
            yAxisId="krw"
            type="monotone"
            dataKey="krw"
            name="원화/g"
            stroke={secondaryColor}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: secondaryColor, strokeWidth: 0 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
