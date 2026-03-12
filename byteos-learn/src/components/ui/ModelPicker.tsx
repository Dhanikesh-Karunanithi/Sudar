'use client'

import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ModelPickerOption {
  id: string
  name: string
  description: string
  icon?: React.ReactNode
}

export interface ModelPickerProps {
  title: string
  subtitle?: string
  options: ModelPickerOption[]
  value: string | null
  onChange: (id: string) => void
  className?: string
}

/**
 * Card grid for selecting an AI model or TTS voice.
 * One option selectable; selected card shows checkmark and highlight.
 */
export function ModelPicker({
  title,
  subtitle,
  options,
  value,
  onChange,
  className,
}: ModelPickerProps) {
  return (
    <div className={cn('space-y-3', className)}>
      <div>
        <h3 className="text-sm font-semibold text-card-foreground">{title}</h3>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {options.map((opt) => {
          const selected = value === opt.id
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChange(opt.id)}
              className={cn(
                'relative flex flex-col items-start gap-1.5 rounded-xl border p-4 text-left transition-all',
                'hover:bg-muted/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                selected
                  ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                  : 'border-border bg-card'
              )}
            >
              {selected && (
                <span
                  className="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground"
                  aria-hidden
                >
                  <Check className="h-3 w-3" />
                </span>
              )}
              {opt.icon && (
                <span className="text-muted-foreground">{opt.icon}</span>
              )}
              <span className="text-sm font-medium text-card-foreground pr-8">
                {opt.name}
              </span>
              <span className="text-xs text-muted-foreground leading-snug">
                {opt.description}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
