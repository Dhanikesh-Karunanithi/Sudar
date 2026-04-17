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
      <p className="text-xs font-medium text-muted-foreground mb-3">Flip cards</p>
      <div className="grid gap-4 sm:grid-cols-2">
        {cards.map((card, i) => (
          <div
            key={i}
            className="perspective-1000 cursor-pointer"
            style={{ perspective: '1000px' }}
            onClick={() => toggle(i)}
          >
            <motion.div
              className="relative h-32 rounded-lg border border-border bg-muted/50 overflow-hidden"
              animate={{ rotateY: flipped.has(i) ? 180 : 0 }}
              transition={{ duration: 0.4 }}
              style={{ transformStyle: 'preserve-3d' }}
            >
              <div
                className="absolute inset-0 flex items-center justify-center p-4 backface-hidden"
                style={{
                  backfaceVisibility: 'hidden',
                  transform: flipped.has(i) ? 'rotateY(180deg)' : 'rotateY(0deg)',
                }}
              >
                <span className="text-sm font-medium text-card-foreground text-center line-clamp-4">
                  {card.front}
                </span>
              </div>
              <div
                className="absolute inset-0 flex items-center justify-center p-4 bg-primary/10 border border-primary/20 rounded-lg"
                style={{
                  backfaceVisibility: 'hidden',
                  transform: flipped.has(i) ? 'rotateY(0deg)' : 'rotateY(180deg)',
                }}
              >
                <span className="text-sm text-card-foreground text-center line-clamp-4">
                  {card.back}
                </span>
              </div>
            </motion.div>
          </div>
        ))}
      </div>
    </div>
  )
}
