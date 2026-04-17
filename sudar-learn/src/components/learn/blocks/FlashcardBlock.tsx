'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Card {
  front: string
  back: string
}

export function FlashcardBlock({ cards }: { cards: Card[] }) {
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const next = () => {
    setIndex((i) => (i + 1) % (cards?.length || 1))
    setFlipped(false)
  }
  const prev = () => {
    setIndex((i) => (i - 1 + (cards?.length || 1)) % (cards?.length || 1))
    setFlipped(false)
  }

  if (!cards?.length) return null
  const card = cards[index]
  return (
    <div className="my-6 rounded-xl border border-border bg-card p-4">
      <p className="text-xs font-medium text-muted-foreground mb-3">
        Card {index + 1} of {cards.length}
      </p>
      <div
        className="relative min-h-[140px] cursor-pointer perspective-1000"
        style={{ perspective: '1000px' }}
        onClick={() => setFlipped((f) => !f)}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={`${index}-${flipped ? 'back' : 'front'}`}
            initial={{ rotateY: flipped ? -90 : 90, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1 }}
            exit={{ rotateY: flipped ? 90 : -90, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="flex items-center justify-center p-6 rounded-lg border border-border bg-muted/50 min-h-[140px]"
          >
            <span className="text-sm font-medium text-card-foreground text-center">
              {flipped ? card.back : card.front}
            </span>
          </motion.div>
        </AnimatePresence>
      </div>
      <p className="text-[10px] text-muted-foreground mt-2 text-center">
        Click card to flip
      </p>
      <div className="flex justify-center gap-2 mt-4">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); prev() }}
          className="px-3 py-1.5 rounded-lg text-sm font-medium bg-muted hover:bg-muted/80 text-card-foreground"
        >
          Previous
        </button>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); next() }}
          className="px-3 py-1.5 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90"
        >
          Next
        </button>
      </div>
    </div>
  )
}
