'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

export interface ActivityDataPoint {
  name: string
  count: number
  minutes?: number
}

export function ActivityChart({ data }: { data: ActivityDataPoint[] }) {
  if (!data?.length) return null
  return (
    <div className="flex-1 w-full min-h-[120px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
          <defs>
            <linearGradient id="colorActivity" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
          <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" />
          <YAxis hide />
          <Tooltip
            contentStyle={{
              borderRadius: '1rem',
              border: '1px solid var(--border)',
              background: 'var(--card)',
              color: 'var(--card-foreground)',
            }}
            formatter={(value: number) => [value, 'Sessions']}
          />
          <Area
            type="monotone"
            dataKey="count"
            stroke="var(--primary)"
            fillOpacity={1}
            fill="url(#colorActivity)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
