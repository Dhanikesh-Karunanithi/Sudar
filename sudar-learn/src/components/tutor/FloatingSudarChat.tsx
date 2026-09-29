'use client'

import { useState, useEffect, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { X, Maximize2, Minimize2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { pickActiveMascot, normalizeMascotPreferences } from '@/lib/mascot/engine'
import { trackMascotEvent } from '@/lib/mascot/tracking'
import { MASCOT_ROLLOUT } from '@/lib/mascot/rollout'
import { SudarChatLaunchButton } from '@/components/tutor/SudarChatLaunchButton'
import { SudarChatPanel } from '@/components/tutor/SudarChatPanel'
import {
  OPEN_TUTOR_EVENT,
  PROACTIVE_FOLLOW_UP_EVENT,
  type OpenTutorDetail,
  type ProactiveFollowUpDetail,
} from '@/lib/tutor/proactiveEvents'
import { CHAT_OPEN_PET_EVENT } from '@/lib/mascot/petSpriteManifest'
import type { MascotPreferences } from '@/types/mascot'

interface FloatingSudarChatProps {
  userId: string
}

export function FloatingSudarChat({ userId }: FloatingSudarChatProps) {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [openTracked, setOpenTracked] = useState(false)
  const [prefs, setPrefs] = useState<MascotPreferences | null>(null)
  const [pendingSend, setPendingSend] = useState<string | null>(null)
  const activeMascot = pickActiveMascot('chat_open', prefs)

  const isTutorChatEnabled = MASCOT_ROLLOUT.surfaces.tutor_chat

  const clearPending = useCallback(() => setPendingSend(null), [])

  useEffect(() => {
    fetch('/api/learner/preferences')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) return
        setPrefs(
          normalizeMascotPreferences({
            mascot_mode: data.mascot_mode,
            mascot_style: data.mascot_style,
            mascot_intensity: data.mascot_intensity,
            mascot_companions: data.mascot_companions,
          }),
        )
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!isOpen || openTracked) return
    setOpenTracked(true)
    window.dispatchEvent(new Event(CHAT_OPEN_PET_EVENT))
    void trackMascotEvent({
      eventType: 'mascot_impression',
      mascotId: activeMascot,
      source: 'tutor_chat',
      detail: { trigger: 'chat_open' },
    })
  }, [activeMascot, isOpen, openTracked])

  useEffect(() => {
    const onFollowUp = (e: Event) => {
      const detail = (e as CustomEvent<ProactiveFollowUpDetail>).detail
      const msg = detail?.message?.trim()
      if (!msg) return
      setIsOpen(true)
      setPendingSend(msg)
    }
    const onOpenTutor = (e: Event) => {
      const detail = (e as CustomEvent<OpenTutorDetail>).detail
      setIsOpen(true)
      const msg = detail?.message?.trim()
      if (msg && !detail?.openOnly) {
        setPendingSend(msg)
      }
    }
    window.addEventListener(PROACTIVE_FOLLOW_UP_EVENT, onFollowUp)
    window.addEventListener(OPEN_TUTOR_EVENT, onOpenTutor)
    return () => {
      window.removeEventListener(PROACTIVE_FOLLOW_UP_EVENT, onFollowUp)
      window.removeEventListener(OPEN_TUTOR_EVENT, onOpenTutor)
    }
  }, [])

  if (!isTutorChatEnabled) return null

  return (
    <>
      {!/\/courses\/[^/]+\/learn/.test(pathname ?? '') && (
        <>
          <SudarChatLaunchButton
            onClick={() => {
              if (isOpen) {
                void trackMascotEvent({
                  eventType: 'mascot_dismiss',
                  mascotId: activeMascot,
                  source: 'tutor_chat',
                  detail: { trigger: 'chat_open' },
                })
              } else {
                setOpenTracked(false)
                window.dispatchEvent(new Event(CHAT_OPEN_PET_EVENT))
              }
              setIsOpen(!isOpen)
            }}
            aria-label={isOpen ? 'Close Sudar chat' : 'Open Sudar chat'}
          />

          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, y: 24, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 24, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className={cn(
                  'fixed z-[60] transition-all duration-200',
                  isExpanded
                    ? 'top-4 right-4 sm:right-6 h-[calc(100vh-6rem)] w-[calc(100vw-2rem)] max-w-[720px] sm:w-[calc(100vw-3rem)]'
                    : 'bottom-24 right-6 h-[520px] w-[calc(100vw-3rem)] max-w-[420px]',
                )}
              >
                <SudarChatPanel
                  userId={userId}
                  variant="floating"
                  className="h-full"
                  listenForOpenEvents={false}
                  pendingSendMessage={pendingSend}
                  onPendingSendConsumed={clearPending}
                  headerActions={
                    <>
                      <button
                        type="button"
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="rounded-lg p-2 text-muted-foreground transition-colors hover:text-card-foreground"
                        aria-label={isExpanded ? 'Collapse chat' : 'Expand chat'}
                        title={isExpanded ? 'Collapse chat' : 'Larger chat panel'}
                      >
                        {isExpanded ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          void trackMascotEvent({
                            eventType: 'mascot_dismiss',
                            mascotId: activeMascot,
                            source: 'tutor_chat',
                            detail: { trigger: 'chat_open' },
                          })
                          setIsOpen(false)
                        }}
                        className="rounded-lg p-2 text-muted-foreground transition-colors hover:text-card-foreground"
                        aria-label="Close"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </>
                  }
                />
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </>
  )
}
