'use client'

import dynamic from 'next/dynamic'
import type { ActivityDataPoint } from './ActivityChart'

const ActivityChart = dynamic(
  () => import('@/components/dashboard/ActivityChart').then((m) => m.ActivityChart),
  { ssr: false }
)

export function ActivityChartClient({ data }: { data: ActivityDataPoint[] }) {
  return <ActivityChart data={data} />
}
