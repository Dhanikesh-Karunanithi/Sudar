'use client'

import dynamic from 'next/dynamic'
import type { ProgressSlice } from './ProgressPieChart'

const ProgressPieChart = dynamic(
  () => import('@/components/progress/ProgressPieChart').then((m) => m.ProgressPieChart),
  { ssr: false }
)

export function ProgressPieChartClient({ data }: { data: ProgressSlice[] }) {
  return <ProgressPieChart data={data} />
}
