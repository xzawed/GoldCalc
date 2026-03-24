import {
  ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ReferenceLine, ResponsiveContainer
} from 'recharts'
import { formatKRW, formatDate } from '@/utils/format'
import type { ForecastPoint } from '@/types/gold'

interface ForecastChartProps {
  points: ForecastPoint[]
  todayDate: string
  metalColor?: string
}

export function ForecastChart({ points, todayDate, metalColor = '#f5c518' }: ForecastChartProps) {
  const data = points.map(p => ({
    date: p.date,
    actual: p.actual,
    predicted: p.predicted,
    upper: p.upper,
    lower: p.lower,
  }))

  return (
    <div role="img" aria-label="시세 예측 차트" data-testid="forecast-chart">
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={data} margin={{ top: 8, right: 16, left: 4, bottom: 4 }}>
          <defs>
            <linearGradient id="bandGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={metalColor} stopOpacity={0.15} />
              <stop offset="95%" stopColor={metalColor} stopOpacity={0.03} />
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
            tickFormatter={(v) => `₩${(v / 1000).toFixed(0)}k`}
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={false}
            tickLine={false}
            width={65}
          />
          <Tooltip
            formatter={(value: number) => [formatKRW(value)]}
            labelFormatter={(label) => formatDate(label as string)}
            contentStyle={{
              background: 'hsl(var(--popover))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '0.75rem',
              fontSize: 12,
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
            formatter={(value) => <span style={{ color: 'hsl(var(--muted-foreground))' }}>{value}</span>}
          />
          <ReferenceLine
            x={todayDate}
            stroke="hsl(var(--muted-foreground))"
            strokeDasharray="4 4"
            strokeOpacity={0.6}
            label={{ value: '오늘', position: 'top', fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          />
          <Area
            type="monotone"
            dataKey="upper"
            name="신뢰구간 상한"
            fill="url(#bandGrad)"
            stroke={metalColor}
            strokeOpacity={0.25}
            strokeWidth={1}
            legendType="none"
          />
          <Area
            type="monotone"
            dataKey="lower"
            name="신뢰구간 하한"
            fill="hsl(var(--background))"
            fillOpacity={0}
            stroke={metalColor}
            strokeOpacity={0.25}
            strokeWidth={1}
            legendType="none"
          />
          <Line
            type="monotone"
            dataKey="actual"
            name="실제값"
            stroke={metalColor}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: metalColor, strokeWidth: 0 }}
            connectNulls={false}
          />
          <Line
            type="monotone"
            dataKey="predicted"
            name="예측값"
            stroke={metalColor}
            strokeWidth={2}
            strokeDasharray="5 5"
            strokeOpacity={0.7}
            dot={false}
            activeDot={{ r: 4, fill: metalColor, strokeWidth: 0 }}
            connectNulls={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
