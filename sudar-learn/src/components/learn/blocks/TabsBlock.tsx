'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Tab {
  label: string
  content: string
}

export function TabsBlock({ tabs }: { tabs: Tab[] }) {
  const [active, setActive] = useState(0)

  if (!tabs?.length) return null
  return (
    <div className="my-6 rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex border-b border-border overflow-x-auto">
        {tabs.map((tab, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setActive(i)}
            className={`
              px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors
              ${active === i ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted/50'}
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="p-4 min-h-[80px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="text-sm text-muted-foreground leading-relaxed prose prose-sm max-w-none"
          >
            {tabs[active]?.content}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
