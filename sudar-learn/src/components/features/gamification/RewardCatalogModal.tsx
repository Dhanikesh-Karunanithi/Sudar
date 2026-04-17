'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ShoppingBag, CheckCircle2, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type RewardCategory = 'ai_powerup' | 'cosmetic' | 'feature'

interface CatalogItem {
  id: string
  slug: string
  title: string
  description: string
  category: RewardCategory
  cost_coins: number
  metadata: Record<string, unknown>
  owned: boolean
  canAfford: boolean
}

interface RewardCatalogModalProps {
  open: boolean
  onClose: () => void
  currentBalance: number
  onPurchase?: (newBalance: number) => void
}

const CATEGORY_LABELS: Record<RewardCategory, string> = {
  ai_powerup: 'AI Power-ups',
  cosmetic:   'Cosmetics',
  feature:    'Features',
}

export function RewardCatalogModal({ open, onClose, currentBalance, onPurchase }: RewardCatalogModalProps) {
  const [catalog, setCatalog] = useState<CatalogItem[]>([])
  const [balance, setBalance] = useState(currentBalance)
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState<string | null>(null)
  const [purchased, setPurchased] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState<RewardCategory | 'all'>('all')

  useEffect(() => {
    setBalance(currentBalance)
  }, [currentBalance])

  const loadCatalog = useCallback(async () => {
    if (!open) return
    setLoading(true)
    try {
      const res = await fetch('/api/rewards')
      if (!res.ok) return
      const json = await res.json() as { data?: { catalog: CatalogItem[]; balance: number } }
      setCatalog(json.data?.catalog ?? [])
      setBalance(json.data?.balance ?? currentBalance)
    } catch {
    } finally {
      setLoading(false)
    }
  }, [open, currentBalance])

  useEffect(() => { loadCatalog() }, [loadCatalog])

  async function handlePurchase(item: CatalogItem) {
    if (item.owned || !item.canAfford || purchasing) return
    setPurchasing(item.slug)
    setError(null)
    try {
      const res = await fetch('/api/rewards/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rewardSlug: item.slug }),
      })
      const json = await res.json() as { success?: boolean; data?: { newBalance: number }; error?: string }
      if (!res.ok || !json.success) {
        setError(json.error ?? 'Purchase failed')
        return
      }
      const newBalance = json.data?.newBalance ?? balance
      setBalance(newBalance)
      setPurchased(item.slug)
      onPurchase?.(newBalance)
      setCatalog((prev) => prev.map((c) => c.slug === item.slug ? { ...c, owned: true, canAfford: newBalance >= c.cost_coins } : { ...c, canAfford: newBalance >= c.cost_coins }))
      setTimeout(() => setPurchased(null), 2000)
    } catch {
      setError('Something went wrong')
    } finally {
      setPurchasing(null)
    }
  }

  const categories: Array<RewardCategory | 'all'> = ['all', 'ai_powerup', 'cosmetic', 'feature']
  const filtered = activeCategory === 'all' ? catalog : catalog.filter((i) => i.category === activeCategory)

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', bounce: 0.2, duration: 0.35 }}
            className="fixed inset-x-4 top-16 bottom-4 z-50 mx-auto max-w-2xl flex flex-col rounded-2xl border border-border bg-card shadow-2xl overflow-hidden"
            role="dialog"
            aria-label="Reward catalog"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-3">
                <ShoppingBag className="w-5 h-5 text-primary" />
                <div>
                  <h2 className="font-display text-lg font-bold text-card-foreground">Reward Catalog</h2>
                  <p className="text-xs text-muted-foreground">Spend your Sudar Coins</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted border border-border text-sm font-semibold text-card-foreground">
                  <span className="text-base">⬡</span>
                  {balance.toLocaleString()} SC
                </div>
                <button
                  onClick={onClose}
                  className="text-muted-foreground hover:text-card-foreground p-1.5 rounded-button hover:bg-muted transition-colors"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Category tabs */}
            <div className="flex items-center gap-1 px-5 py-2 border-b border-border overflow-x-auto no-scrollbar">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all',
                    activeCategory === cat
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-card-foreground hover:bg-muted'
                  )}
                >
                  {cat === 'all' ? 'All' : CATEGORY_LABELS[cat]}
                </button>
              ))}
            </div>

            {/* Catalog grid */}
            <div className="flex-1 overflow-y-auto p-5">
              {loading ? (
                <div className="flex items-center justify-center h-40">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filtered.map((item) => (
                    <div
                      key={item.id}
                      className={cn(
                        'relative flex flex-col gap-2 p-4 rounded-card-lg border transition-all',
                        item.owned
                          ? 'border-success/40 bg-success/5'
                          : item.canAfford
                            ? 'border-border hover:border-primary/40 hover:shadow-sm cursor-pointer'
                            : 'border-border bg-muted/30 opacity-60'
                      )}
                      onClick={() => !item.owned && handlePurchase(item)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-card-foreground leading-tight">{item.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{item.description}</p>
                        </div>
                        {item.owned && (
                          <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-auto pt-2 border-t border-border/50">
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                          {CATEGORY_LABELS[item.category]}
                        </span>
                        {item.owned ? (
                          <span className="text-xs font-semibold text-success">Owned</span>
                        ) : (
                          <button
                            disabled={!item.canAfford || !!purchasing}
                            onClick={(e) => { e.stopPropagation(); handlePurchase(item) }}
                            className="flex items-center gap-1 px-3 py-1 rounded-button bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 disabled:opacity-40 transition-all"
                          >
                            {purchasing === item.slug ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : purchased === item.slug ? (
                              <CheckCircle2 className="w-3 h-3" />
                            ) : (
                              <><span>⬡</span> {item.cost_coins}</>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {error && (
              <div className="px-5 pb-3">
                <p className="text-xs text-destructive text-center">{error}</p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
