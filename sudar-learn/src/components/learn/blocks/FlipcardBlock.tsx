'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'

interface Card {
  front: string
  back: string
}

export function FlipcardBlock({ cards }: { cards: Card[] }) {
  const [flipped, setFlipped] = useState<Set<number>>(new Set())
  const toggle = (i: number) =>
    setFlipped((prev) => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })

  if (!cards?.length) return null
  return (
    <div className="my-6 rounded-xl border border-border bg-card p-4">
      <p className="text-xs font-medium text-muted-foreground mb-3">Flip cards — tap to reveal</p>
      <div className="grid gap-4 sm:grid-cols-2">
        {cards.map((card, i) => (
          <button
            key={i}
            type="button"
            className="perspective-1000 cursor-pointer text-left w-full"
            style={{ perspective: '1000px' }}
            onClick={() => toggle(i)}
            aria-pressed={flipped.has(i)}
            aria-label={`Flip card: ${card.front}`}
          >
            <motion.div
              className="relative h-36 w-full"
              style={{ transformStyle: 'preserve-3d' }}
              animate={{ rotateY: flipped.has(i) ? 180 : 0 }}
              transition={{ duration: 0.45 }}
            >
              <div
                className="absolute inset-0 flex items-center justify-center p-4 rounded-lg border border-border bg-muted/50"
                style={{
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                  transform: 'rotateY(0deg)',
                }}
              >
                <span className="text-sm font-medium text-card-foreground text-center line-clamp-5">
                  {card.front}
                </span>
              </div>
              <div
                className="absolute inset-0 flex items-center justify-center p-4 rounded-lg border border-primary/30 bg-primary/10"
                style={{
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                }}
              >
                <span className="text-sm text-card-foreground text-center line-clamp-5 leading-relaxed">
                  {card.back}
                </span>
              </div>
            </motion.div>
          </button>
        ))}
      </div>
    </div>
  )
}
