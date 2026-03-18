import {
  ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ReferenceLine, ResponsiveContainer
} from 'recharts'
import { formatKRW, formatDate } from '@/utils/format'
import type { ForecastPoint } from '@/types/gold'

interface ForecastChartProps {
  points: ForecastPoint[]
  todayDate: string
}

export function ForecastChart({ points, todayDate }: ForecastChartProps) {
  const data = points.map(p => ({
    date: p.date,
    actual: p.actual,
    predicted: p.predicted,
    upper: p.upper,
    lower: p.lower,
  }))

  return (
    <div role="img" aria-label="금시세 예측 차트" data-testid="forecast-chart">
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
          <defs>
            <linearGradient id="bandGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.05} />
            </linearGradient>
          </defs>
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
            tickFormatter={(v) => `₩${(v / 1000).toFixed(0)}k`}
            tick={{ fontSize: 11 }}
            width={65}
          />
          <Tooltip
            formatter={(value: number, name: string) => {
              if (name === '신뢰구간 상한' || name === '신뢰구간 하한') return [formatKRW(value), name]
              return [formatKRW(value), name]
            }}
            labelFormatter={(label) => formatDate(label as string)}
          />
          <Legend />
          <ReferenceLine
            x={todayDate}
            stroke="#888"
            strokeDasharray="4 4"
            label={{ value: '오늘', position: 'top', fontSize: 11 }}
          />
          <Area
            type="monotone"
            dataKey="upper"
            name="신뢰구간 상한"
            fill="url(#bandGrad)"
            stroke="#f59e0b"
            strokeOpacity={0.3}
            strokeWidth={1}
            legendType="none"
          />
          <Area
            type="monotone"
            dataKey="lower"
            name="신뢰구간 하한"
            fill="white"
            fillOpacity={0}
            stroke="#f59e0b"
            strokeOpacity={0.3}
            strokeWidth={1}
            legendType="none"
          />
          <Line
            type="monotone"
            dataKey="actual"
            name="실제값"
            stroke="#f59e0b"
            strokeWidth={2}
            dot={false}
            connectNulls={false}
          />
          <Line
            type="monotone"
            dataKey="predicted"
            name="예측값"
            stroke="#f59e0b"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
            connectNulls={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
