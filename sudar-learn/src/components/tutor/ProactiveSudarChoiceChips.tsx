'use client'

import type { ProactivePromptChoice } from '@/types/tutor'
import { cn } from '@/lib/utils'

type Props = {
  choices: ProactivePromptChoice[]
  onSelect: (choice: ProactivePromptChoice) => void
  disabled?: boolean
  className?: string
}

export function ProactiveSudarChoiceChips({ choices, onSelect, disabled, className }: Props) {
  if (!choices.length) return null
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {choices.map((c) => (
        <button
          key={c.id}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(c)}
          className="rounded-full bg-card/90 border border-border px-3.5 py-2 text-xs sm:text-sm text-card-foreground hover:bg-primary/10 hover:border-primary/30 transition-colors text-left disabled:opacity-50"
          aria-label={`Sudar suggestion: ${c.label}`}
        >
          {c.label}
        </button>
      ))}
    </div>
  )
}
