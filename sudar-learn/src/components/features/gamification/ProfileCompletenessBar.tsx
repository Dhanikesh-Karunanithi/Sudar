'use client'

import { cn } from '@/lib/utils'
import { User } from 'lucide-react'
import Link from 'next/link'

interface ProfileCompletenessBarProps {
  completeness: number
  className?: string
}

const COIN_MILESTONES = [
  { pct: 25, coins: 50 },
  { pct: 50, coins: 75 },
  { pct: 75, coins: 100 },
  { pct: 100, coins: 200 },
]

export function ProfileCompletenessBar({ completeness, className }: ProfileCompletenessBarProps) {
  const nextMilestone = COIN_MILESTONES.find((m) => m.pct > completeness)

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-semibold text-card-foreground">Academy Profile</span>
          <span className="text-xs text-muted-foreground">{completeness}% complete</span>
        </div>
        {nextMilestone && (
          <Link
            href="/settings#profile"
            className="text-xs font-medium text-primary hover:opacity-80"
          >
            +{nextMilestone.coins} SC at {nextMilestone.pct}%
          </Link>
        )}
      </div>
      <div className="relative w-full h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-[width] duration-700"
          style={{ width: `${completeness}%` }}
        />
        {/* Milestone markers */}
        {COIN_MILESTONES.map((m) => (
          <div
            key={m.pct}
            className={cn(
              'absolute top-0 h-full w-0.5',
              completeness >= m.pct ? 'bg-primary-foreground/40' : 'bg-border'
            )}
            style={{ left: `${m.pct}%` }}
            aria-hidden
          />
        ))}
      </div>
    </div>
  )
}
