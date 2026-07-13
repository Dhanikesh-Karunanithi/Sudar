'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CheckinQuestion {
  id: string
  question_text: string
  answer_type: 'scale' | 'choice' | 'text' | 'boolean'
  options: string[] | { min: number; max: number; labels: string[] } | null
  signal_key: string
  category: string
}

export function CheckinFloatingCard() {
  const [question, setQuestion] = useState<CheckinQuestion | null>(null)
  const [visible, setVisible] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [answer, setAnswer] = useState<unknown>(null)
  const [submitted, setSubmitted] = useState(false)
  const [earning, setEarning] = useState(false)
  const [coinsEarned, setCoinsEarned] = useState(10)
  const [levelUpText, setLevelUpText] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const loadQuestion = useCallback(async () => {
    if (dismissed) return
    try {
      const res = await fetch('/api/checkin/next')
      if (!res.ok) return
      const json = await res.json() as { data?: CheckinQuestion | null; reason?: string }
      if (json.data) {
        setQuestion(json.data)
        // Show after a short delay for post-session feel
        setTimeout(() => setVisible(true), 1500)
      }
    } catch {}
  }, [dismissed])

  useEffect(() => {
    // Show check-in after 8 seconds on the page
    const t = setTimeout(loadQuestion, 8000)
    return () => clearTimeout(t)
  }, [loadQuestion])

  async function handleSubmit() {
    if (!question || answer === null || answer === '') return
    setEarning(true)
    setSubmitError(null)
    try {
      const res = await fetch('/api/checkin/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId: question.id, answerValue: answer }),
      })
      const json = await res.json() as {
        success?: boolean
        error?: string
        data?: { coinsEarned?: number; levelUp?: { to: number } | null }
      }
      if (!res.ok || !json.success) {
        setSubmitError(json.error ?? 'Unable to submit check-in right now. Please try again.')
        return
      }
      setCoinsEarned(json.data?.coinsEarned ?? 10)
      if (json.data?.levelUp?.to) {
        setLevelUpText(`Level ${json.data.levelUp.to} reached`)
      } else {
        setLevelUpText(null)
      }
      setSubmitted(true)
      setTimeout(() => setVisible(false), 2000)
    } catch {
    } finally {
      setEarning(false)
    }
  }

  function handleDismiss() {
    setVisible(false)
    setDismissed(true)
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.97 }}
          transition={{ type: 'spring', bounce: 0.3, duration: 0.4 }}
          className="fixed bottom-6 right-6 z-50 w-80 rounded-2xl border border-border bg-card shadow-xl shadow-black/10 dark:shadow-black/30 overflow-hidden"
          data-sudar-checkin=""
          role="dialog"
          aria-label="Sudar check-in"
        >
          {submitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-6 gap-2"
            >
              <span className="text-3xl">⬡</span>
              <p className="text-sm font-semibold text-card-foreground">+{coinsEarned} Sudar Coins!</p>
              <p className="text-xs text-muted-foreground">Thanks for sharing.</p>
              {levelUpText && <p className="text-xs font-medium text-primary">{levelUpText}</p>}
            </motion.div>
          ) : (
            <>
              <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-primary/5">
                <div className="flex items-center gap-2">
                  <span className="text-lg" role="img" aria-hidden>⬡</span>
                  <div>
                    <p className="text-xs font-bold text-card-foreground">Sudar Check-in</p>
                    <p className="text-[10px] text-muted-foreground">Earn 10 SC for answering</p>
                  </div>
                </div>
                <button
                  onClick={handleDismiss}
                  className="text-muted-foreground hover:text-card-foreground transition-colors p-1 rounded"
                  aria-label="Dismiss check-in"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="px-4 py-3">
                <p className="text-sm font-medium text-card-foreground mb-3 leading-snug">
                  {question?.question_text}
                </p>

                {question?.answer_type === 'choice' && Array.isArray(question.options) && (
                  <div className="space-y-1.5">
                    {(question.options as string[]).map((opt) => (
                      <button
                        key={opt}
                        onClick={() => setAnswer(opt)}
                        className={cn(
                          'w-full text-left px-3 py-2 rounded-button border text-sm transition-all',
                          answer === opt
                            ? 'border-primary bg-primary/10 text-primary font-medium'
                            : 'border-border text-muted-foreground hover:border-primary/40 hover:text-card-foreground'
                        )}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}

                {question?.answer_type === 'boolean' && (
                  <div className="flex gap-2">
                    {['Yes', 'No'].map((opt) => (
                      <button
                        key={opt}
                        onClick={() => setAnswer(opt === 'Yes')}
                        className={cn(
                          'flex-1 py-2 rounded-button border text-sm font-medium transition-all',
                          answer === (opt === 'Yes')
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border text-muted-foreground hover:border-primary/40'
                        )}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}

                {question?.answer_type === 'scale' && !Array.isArray(question.options) && question.options && (
                  <div>
                    <div className="flex justify-between text-[10px] text-muted-foreground mb-2">
                      <span>{(question.options as { min: number; max: number; labels: string[] }).labels?.[0]}</span>
                      <span>{(question.options as { min: number; max: number; labels: string[] }).labels?.[1]}</span>
                    </div>
                    <div className="flex gap-1.5 justify-between">
                      {Array.from(
                        { length: (question.options as { min: number; max: number }).max - (question.options as { min: number; max: number }).min + 1 },
                        (_, i) => (question.options as { min: number }).min + i
                      ).map((n) => (
                        <button
                          key={n}
                          onClick={() => setAnswer(n)}
                          className={cn(
                            'flex-1 aspect-square rounded-lg border text-sm font-semibold transition-all',
                            answer === n
                              ? 'border-primary bg-primary text-primary-foreground'
                              : 'border-border text-muted-foreground hover:border-primary/40'
                          )}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {question?.answer_type === 'text' && (
                  <textarea
                    value={(answer as string) ?? ''}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="Type your answer..."
                    rows={2}
                    className="w-full text-sm border border-border rounded-button px-3 py-2 bg-muted focus:outline-none focus:ring-1 focus:ring-primary/30 resize-none placeholder:text-muted-foreground/50"
                    aria-label="Check-in answer"
                  />
                )}
                {submitError && (
                  <p className="mt-2 text-xs font-medium text-destructive" role="alert">
                    {submitError}
                  </p>
                )}
              </div>

              <div className="px-4 pb-3 flex items-center justify-between gap-2">
                <button
                  onClick={handleDismiss}
                  className="text-xs text-muted-foreground hover:text-card-foreground"
                >
                  Maybe later
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={answer === null || answer === '' || earning}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-primary text-primary-foreground rounded-button text-sm font-semibold hover:opacity-90 disabled:opacity-40 transition-all"
                >
                  {earning ? 'Saving…' : (
                    <>
                      <span className="text-sm">⬡</span> +10 SC
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
