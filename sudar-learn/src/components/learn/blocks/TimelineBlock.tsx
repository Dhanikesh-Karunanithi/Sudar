'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Step {
  title: string
  description: string
  icon?: string
}

export function TimelineBlock({ steps }: { steps: Step[] }) {
  const [revealed, setRevealed] = useState<number>(0)
  const next = () => setRevealed((r) => Math.min(r + 1, steps.length))
  const prev = () => setRevealed((r) => Math.max(r - 1, 0))

  if (!steps?.length) return null
  return (
    <div className="my-6 rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <span className="text-sm font-medium text-card-foreground">Timeline</span>
        <span className="text-xs text-muted-foreground">
          {revealed + 1} / {steps.length}
        </span>
      </div>
      <div className="p-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={revealed}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-2"
          >
            <h4 className="text-base font-semibold text-card-foreground">
              {steps[revealed]?.title || 'Step'}
            </h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {steps[revealed]?.description || ''}
            </p>
          </motion.div>
        </AnimatePresence>
        <div className="flex gap-2 mt-4">
          <button
            type="button"
            onClick={prev}
            disabled={revealed <= 0}
            className="px-3 py-1.5 rounded-lg text-sm font-medium bg-muted hover:bg-muted/80 text-card-foreground disabled:opacity-50 disabled:pointer-events-none"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={next}
            disabled={revealed >= steps.length - 1}
            className="px-3 py-1.5 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:pointer-events-none"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}
