'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'

const OPTIONS = [
  { value: 'week', label: 'Last 7 days' },
  { value: 'month', label: 'Last 30 days' },
  { value: 'quarter', label: 'Last 90 days' },
  { value: 'all', label: 'All time' },
] as const

export function DateRangeFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const current = searchParams.get('range') ?? 'all'

  function setRange(value: string) {
    const next = new URLSearchParams(searchParams.toString())
    if (value === 'all') next.delete('range')
    else next.set('range', value)
    router.push(`/analytics?${next.toString()}`)
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-slate-500 text-sm font-medium">Date range:</span>
      <div className="flex rounded-lg bg-slate-800 p-0.5 border border-slate-700">
        {OPTIONS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => setRange(value)}
            className={cn(
              'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
              current === value
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-700'
            )}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
