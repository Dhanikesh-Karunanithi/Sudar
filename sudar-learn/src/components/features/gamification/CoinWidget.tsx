'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface CoinWidgetProps {
  initialBalance?: number
  className?: string
}

export function CoinWidget({ initialBalance = 0, className }: CoinWidgetProps) {
  const [balance, setBalance] = useState(initialBalance)
  const [animating, setAnimating] = useState(false)
  const [prevBalance, setPrevBalance] = useState(initialBalance)

  useEffect(() => {
    setBalance(initialBalance)
    setPrevBalance(initialBalance)
  }, [initialBalance])

  useEffect(() => {
    if (balance !== prevBalance) {
      setAnimating(true)
      setPrevBalance(balance)
      const t = setTimeout(() => setAnimating(false), 1200)
      return () => clearTimeout(t)
    }
  }, [balance, prevBalance])

  // Poll balance every 30 seconds and bypass cache to self-heal stale SSR values.
  useEffect(() => {
    async function fetchBalance() {
      try {
        const res = await fetch('/api/coins/balance', { cache: 'no-store' })
        if (!res.ok) return
        const json = await res.json() as { data?: { balance?: number } }
        const newBalance = json.data?.balance
        if (typeof newBalance !== 'number') return
        setBalance((current) => (current === newBalance ? current : newBalance))
      } catch {}
    }

    const interval = setInterval(fetchBalance, 30000)
    fetchBalance()
    return () => clearInterval(interval)
  }, [])

  return (
    <Link
      href="/coins"
      aria-label={`${balance} Sudar Coins — view coin balance`}
      className={cn(
        'flex items-center gap-1.5 rounded-full border border-border bg-card/80 px-3 py-1.5 text-sm font-semibold text-card-foreground hover:border-primary/40 hover:bg-muted transition-all duration-150 select-none',
        animating && 'border-yellow-400/60 bg-yellow-50/10 dark:bg-yellow-900/10',
        className
      )}
    >
      <span className="text-base leading-none" role="img" aria-hidden>⬡</span>
      <AnimatePresence mode="wait">
        <motion.span
          key={balance}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 6 }}
          transition={{ duration: 0.2 }}
          className={cn('tabular-nums', animating && 'text-yellow-500')}
        >
          {balance.toLocaleString()}
        </motion.span>
      </AnimatePresence>
      <span className="text-muted-foreground text-xs font-medium hidden sm:inline">SC</span>
    </Link>
  )
}
