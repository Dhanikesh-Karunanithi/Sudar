'use client'

import { useState, useRef, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { X, Send, ExternalLink, Maximize2, Minimize2 } from 'lucide-react'
import { SudarInlineLoader } from '@/components/branding/SudarBrandLoader'
import { cn, stripTutorModelArtifactsFromText } from '@/lib/utils'
import type { TutorAction, TutorBlock } from '@/types/tutor'
import { GenerativeBlockRenderer } from './GenerativeBlockRenderer'
import { ChatMarkdown } from './ChatMarkdown'
import { buildMascotResponse, normalizeMascotPreferences, pickActiveMascot } from '@/lib/mascot/engine'
import { trackMascotEvent } from '@/lib/mascot/tracking'
import { MascotModeBadge } from '@/components/mascot/MascotModeBadge'
import type { MascotPreferences } from '@/types/mascot'
import { MASCOT_ROLLOUT } from '@/lib/mascot/rollout'
import { SudarChatLaunchButton } from '@/components/tutor/SudarChatLaunchButton'
import { ProactiveSudarChoiceChips } from '@/components/tutor/ProactiveSudarChoiceChips'
import { PROACTIVE_FOLLOW_UP_EVENT, type ProactiveFollowUpDetail } from '@/lib/tutor/proactiveEvents'
import type { ProactivePromptChoice } from '@/types/tutor'
import { validateTutorQueryResponsePayload } from '@/lib/tutor/responseContract'
import { useNotificationSound } from '@/components/features/notifications/NotificationSoundProvider'
import { CHAT_OPEN_PET_EVENT } from '@/lib/mascot/petSpriteManifest'
import { SUDAR_PERSONA_VOICE } from '@/lib/mascot/sudarPersonaVoice'
import { SudarPetSprite } from '@/components/mascot/SudarPetSprite'
import {
  getCachedConversation,
  isLocalTutorCacheEnabled,
  putCachedConversation,
} from '@/lib/cache/localTutorCache'

interface Message {
  role: 'user' | 'assistant'
  content: string
  actions?: TutorAction[]
  blocks?: TutorBlock[]
}

type RoutingMeta = {
  decision: 'local' | 'cloud'
  provider_id: string
  model: string
  fallback_used?: boolean
  fallback_reason?: string | null
}

const STARTUP_CHIPS: ProactivePromptChoice[] = [
  { id: 'courses', label: 'Courses I can take', follow_up_message: 'Are there any courses I can take?' },
  { id: 'next', label: 'What should I learn next?', follow_up_message: 'What should I learn next?' },
  { id: 'recommend', label: 'Recommend a course', follow_up_message: 'Recommend a course for me' },
  { id: 'progress', label: 'Show my progress', follow_up_message: 'Show me my progress' },
  { id: 'skills', label: 'Improve my skills', follow_up_message: 'Are there any courses on improving skills?' },
]

interface FloatingSudarChatProps {
  userId: string
}

export function FloatingSudarChat({ userId }: FloatingSudarChatProps) {
  const { playChime } = useNotificationSound()
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [pastedText, setPastedText] = useState('')
  const [thinking, setThinking] = useState(false)
  const [syncStatus, setSyncStatus] = useState<'idle' | 'synced' | 'reconnecting'>('idle')
  const [lastRouting, setLastRouting] = useState<RoutingMeta | null>(null)
  const [prefs, setPrefs] = useState<MascotPreferences | null>(null)
  const [pedagogyMode, setPedagogyMode] = useState<'explain' | 'guide' | 'exam_focus'>('explain')
  const [openTracked, setOpenTracked] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)
  const handleSendWithMessageRef = useRef<(msg: string) => Promise<void>>(async () => {})
  const activeMascot = pickActiveMascot('chat_open', prefs)
  const greetingCopy = buildMascotResponse('chat_open', prefs).text

  const isTutorChatEnabled = MASCOT_ROLLOUT.surfaces.tutor_chat

  useEffect(() => {
    if (isOpen && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [isOpen, messages])

  useEffect(() => {
    if (!isLocalTutorCacheEnabled()) return
    let cancelled = false
    getCachedConversation(userId, 'floating')
      .then((cached) => {
        if (cancelled || !cached || cached.length === 0) return
        setMessages((current) => (current.length > 0 ? current : cached))
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [userId])

  useEffect(() => {
    fetch('/api/learner/preferences')
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (!data) return
        setPrefs(normalizeMascotPreferences({
          mascot_mode: data.mascot_mode,
          mascot_style: data.mascot_style,
          mascot_intensity: data.mascot_intensity,
          mascot_companions: data.mascot_companions,
        }))
        const d = data.preferences?.tutor_pedagogy_default
        if (d === 'explain' || d === 'guide' || d === 'exam_focus') {
          setPedagogyMode(d)
        }
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

  async function handleSendWithMessage(msg: string) {
    const trimmed = msg.trim()
    if (!trimmed || thinking) return
    setInput('')
    const newMessages: Message[] = [...messages, { role: 'user', content: trimmed }]
    setMessages(newMessages)
    setThinking(true)
    void trackMascotEvent({
      eventType: 'mascot_interaction',
      mascotId: pickActiveMascot('chat_query', prefs),
      source: 'tutor_chat',
      detail: { trigger: 'chat_query' },
    })

    let tutorSucceeded = false
    try {
      const res = await fetch('/api/tutor/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          conversation_history: newMessages.slice(0, -1),
          route: pathname ?? undefined,
          pedagogy_mode: pedagogyMode,
          ...(pastedText.trim() ? { pasted_text: pastedText.trim().slice(0, 15000) } : {}),
        }),
      })
      const text = await res.text()
      let rawPayload: unknown = {}
      if (text) {
        try {
          rawPayload = JSON.parse(text)
        } catch {
          rawPayload = { error: 'Invalid response from tutor.' }
        }
      }
      const data = validateTutorQueryResponsePayload(rawPayload)
      if (!res.ok) {
        setMessages([
          ...newMessages,
          { role: 'assistant', content: data.error ?? 'Something went wrong. Please try again.' },
        ])
        return
      }
      const mergedMessages: Message[] = [
        ...newMessages,
        {
          role: 'assistant',
          content: data.response ?? 'I had trouble completing that answer. Please try again.',
          actions: data.actions?.length ? data.actions : undefined,
          blocks: data.blocks,
        },
      ]
      setMessages(mergedMessages)
      tutorSucceeded = true
      setLastRouting((data.routing as RoutingMeta | undefined) ?? null)
      if (isLocalTutorCacheEnabled()) {
        setSyncStatus('reconnecting')
        void putCachedConversation(
          userId,
          'floating',
          mergedMessages.map((m) => ({ role: m.role, content: m.content })),
        )
          .then(() => setSyncStatus('synced'))
          .catch(() => {})
      }
    } catch {
      setMessages([
        ...newMessages,
        { role: 'assistant', content: 'Unable to reach Sudar. Please check your connection and try again. You can also retry with a shorter question.' },
      ])
    } finally {
      setThinking(false)
      setPastedText('')
      if (tutorSucceeded) playChime('sudar_reply')
    }
  }

  handleSendWithMessageRef.current = handleSendWithMessage

  useEffect(() => {
    const onFollowUp = (e: Event) => {
      const detail = (e as CustomEvent<ProactiveFollowUpDetail>).detail
      const msg = detail?.message?.trim()
      if (!msg) return
      setIsOpen(true)
      void handleSendWithMessageRef.current(msg)
    }
    window.addEventListener(PROACTIVE_FOLLOW_UP_EVENT, onFollowUp)
    return () => window.removeEventListener(PROACTIVE_FOLLOW_UP_EVENT, onFollowUp)
  }, [])

  async function handleSend() {
    const msg = input.trim()
    if (!msg || thinking) return
    await handleSendWithMessage(msg)
  }

  if (!isTutorChatEnabled) return null

  return (
    <>
      {/* Hide FAB and panel on course learn page (inline tutor is shown there) */}
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
              'fixed z-[60] liquid-glass flex flex-col overflow-hidden rounded-[var(--radius-chat-panel)] shadow-2xl transition-all duration-200',
              isExpanded
                ? 'top-4 right-4 sm:right-6 w-[calc(100vw-2rem)] sm:w-[calc(100vw-3rem)] max-w-[720px] h-[calc(100vh-6rem)]'
                : 'bottom-24 right-6 w-[calc(100vw-3rem)] max-w-[420px] h-[520px]'
            )}
          >
            <div className="p-5 border-b border-border flex items-center justify-between gap-2 shrink-0 bg-card/80">
              <div className="flex items-center gap-3 min-w-0">
                <MascotModeBadge mascotId={activeMascot} />
                {lastRouting && (
                  <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-pill">
                    {lastRouting.decision === 'local'
                      ? 'Local model active'
                      : lastRouting.fallback_used
                        ? 'Cloud fallback used'
                        : 'Cloud model active'}
                  </span>
                )}
                {isLocalTutorCacheEnabled() && (
                  <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-pill">
                    {syncStatus === 'reconnecting' ? 'Reconnecting…' : syncStatus === 'synced' ? 'Synced with Sudar' : 'Local cache ready'}
                  </span>
                )}
              </div>
              <div className="flex items-center shrink-0">
                <button
                  type="button"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-2 text-muted-foreground hover:text-card-foreground transition-colors rounded-lg"
                  aria-label={isExpanded ? 'Collapse chat' : 'Expand chat'}
                  title={isExpanded ? 'Collapse chat' : 'Larger chat panel'}
                >
                  {isExpanded ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
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
                  className="p-2 text-muted-foreground hover:text-card-foreground transition-colors rounded-lg"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="px-5 py-2 border-b border-border/70 bg-muted/30 flex items-center gap-3">
              <SudarPetSprite state="idle" size={34} />
              <p className="text-xs text-muted-foreground">
                {SUDAR_PERSONA_VOICE.signatureLines[0]}
              </p>
            </div>

            <div
              ref={listRef}
              className="flex-1 overflow-y-auto p-5 space-y-4"
            >
              {messages.length === 0 && (
                <>
                  <div className="chat-bubble bg-muted/80 text-card-foreground border border-border">
                    {`Hi! I'm Sudar. ${greetingCopy}`}
                  </div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">Try asking</p>
                  <ProactiveSudarChoiceChips
                    choices={STARTUP_CHIPS}
                    onSelect={(c) => {
                      void trackMascotEvent({
                        eventType: 'mascot_nudge_outcome',
                        mascotId: activeMascot,
                        source: 'tutor_chat',
                        detail: { nudge_type: 'startup_question', accepted: true },
                      })
                      const q = c.follow_up_message?.trim()
                      if (q) void handleSendWithMessage(q)
                    }}
                  />
                </>
              )}
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}
                >
                  <div className="flex flex-col gap-2 max-w-[85%]">
                    <div
                      className={cn(
                        'chat-bubble',
                        m.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted/80 text-card-foreground border border-border'
                      )}
                    >
                      {m.role === 'assistant' && m.blocks?.length ? (
                        <GenerativeBlockRenderer
                          blocks={m.blocks}
                          onActionClick={(action) => {
                            fetch('/api/tutor/outcome', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                course_id: action.course_id ?? undefined,
                                path_id: action.path_id ?? undefined,
                                action_label: action.label,
                              }),
                            }).catch(() => {})
                          }}
                          onTutorChoice={(d) => {
                            const courseFromPath =
                              (pathname?.match(/^\/courses\/([^/]+)\/learn/) ?? [])[1] ?? undefined
                            void fetch('/api/tutor/choice', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                block_id: d.blockId,
                                choice_id: d.choiceId,
                                label: d.label,
                                course_id: courseFromPath,
                              }),
                            }).catch(() => {})
                            void handleSendWithMessage(d.followUpMessage)
                          }}
                          onQuizRetry={() => handleSendWithMessage('Give me another quiz question')}
                        />
                      ) : (
                        <>
                          {m.role === 'assistant' ? <ChatMarkdown text={stripTutorModelArtifactsFromText(m.content)} /> : m.content}
                          {m.role === 'assistant' && m.actions && m.actions.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {m.actions.map((action, aIdx) => (
                                <Link
                                  key={aIdx}
                                  href={action.href}
                                  onClick={() => {
                                    fetch('/api/tutor/outcome', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({
                                        course_id: action.course_id ?? undefined,
                                        path_id: action.path_id ?? undefined,
                                        action_label: action.label,
                                      }),
                                    }).catch(() => {})
                                  }}
                                  className="inline-flex items-center gap-1.5 rounded-full bg-primary/90 px-4 py-2 text-sm font-semibold text-primary-foreground shadow-md hover:bg-primary transition-colors"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                  {action.label}
                                </Link>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {thinking && (
                <div className="flex justify-start">
                  <div className="chat-bubble bg-muted/80 text-card-foreground border border-border flex items-center gap-2">
                    <SudarInlineLoader size="sm" className="shrink-0" />
                    <span>Thinking…</span>
                  </div>
                </div>
              )}
            </div>

            <div className="p-5 border-t border-border bg-card/80 shrink-0">
              {pastedText.length > 0 && (
                <div className="mb-2 rounded-lg border border-border bg-card/80 p-2">
                  <p className="text-[10px] text-muted-foreground mb-1">Pasted text ({pastedText.length} chars) — will be sent with your message</p>
                  <button
                    type="button"
                    onClick={() => setPastedText('')}
                    className="text-xs text-primary hover:underline"
                  >
                    Clear
                  </button>
                </div>
              )}
              <div className="relative flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Ask Sudar anything..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  className="w-full bg-card/80 border border-border rounded-pill py-3 px-5 pr-14 text-sm text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!input.trim() || thinking}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 h-10 w-10 shrink-0 bg-primary text-primary-foreground rounded-pill flex items-center justify-center shadow-lg hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100"
                  aria-label="Send"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <div className="mt-2">
                <textarea
                  placeholder="Paste text here to summarize or extract key terms (then type e.g. &quot;Summarize this&quot; and send)"
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  className="w-full min-h-[56px] max-h-[120px] resize-y rounded-lg border border-border bg-card/80 px-3 py-2 text-xs text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  rows={2}
                />
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mt-2">
                <Link href="/help" className="text-[10px] font-medium text-primary hover:underline shrink-0">
                  Sudar Help Center
                </Link>
                <p className="text-[10px] text-muted-foreground leading-relaxed sm:text-right">
                  Sudar is for learning. Do not paste passwords, card numbers, or private keys.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </>
      )}
    </>
  )
}
