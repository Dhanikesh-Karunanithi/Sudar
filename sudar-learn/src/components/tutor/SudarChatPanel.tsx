'use client'

import { useState, useRef, useEffect, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Send, ExternalLink, History, Plus } from 'lucide-react'
import { SudarInlineLoader } from '@/components/branding/SudarBrandLoader'
import { cn, safeNotebookPreview, stripTutorModelArtifactsFromText } from '@/lib/utils'
import { normalizeTutorDisplayText } from '@/lib/tutor/normalizeTutorDisplayText'
import type { TutorAction, TutorBlock } from '@/types/tutor'
import { GenerativeBlockRenderer } from './GenerativeBlockRenderer'
import { ChatMarkdown } from './ChatMarkdown'
import { buildMascotResponse, normalizeMascotPreferences, pickActiveMascot } from '@/lib/mascot/engine'
import { trackMascotEvent } from '@/lib/mascot/tracking'
import { MascotModeBadge } from '@/components/mascot/MascotModeBadge'
import type { MascotPreferences } from '@/types/mascot'
import { MASCOT_ROLLOUT } from '@/lib/mascot/rollout'
import { ProactiveSudarChoiceChips } from '@/components/tutor/ProactiveSudarChoiceChips'
import {
  JOURNEY_ARTIFACTS_EVENT,
  OPEN_TUTOR_EVENT,
  PROACTIVE_FOLLOW_UP_EVENT,
  type JourneyArtifactsDetail,
  type OpenTutorDetail,
  type ProactiveFollowUpDetail,
} from '@/lib/tutor/proactiveEvents'
import { JOURNEY_CANVAS_BLOCK_TYPES } from '@/types/tutor'
import type { ProactivePromptChoice } from '@/types/tutor'
import { parseTutorQueryHttpResponse } from '@/lib/tutor/responseContract'
import { useNotificationSound } from '@/components/features/notifications/NotificationSoundProvider'
import { CHAT_OPEN_PET_EVENT } from '@/lib/mascot/petSpriteManifest'
import { SUDAR_PERSONA_VOICE } from '@/lib/mascot/sudarPersonaVoice'
import { SudarPetSprite } from '@/components/mascot/SudarPetSprite'
import { EarlyAccessFeedbackPanel } from '@/components/feedback/EarlyAccessFeedbackPanel'
import { ChatHistoryPanel } from '@/components/tutor/ChatHistoryPanel'
import {
  createTutorThread,
  DEFAULT_THREAD_TITLE,
  deleteTutorThread,
  ensureActiveTutorThread,
  isLocalTutorCacheEnabled,
  listTutorThreads,
  renameTutorThread,
  saveTutorThreadMessages,
  setActiveTutorThreadId,
  setTutorThreadPinned,
  type TutorThread,
} from '@/lib/cache/localTutorCache'

export interface SudarChatMessage {
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

const DEFAULT_STARTUP_CHIPS: ProactivePromptChoice[] = [
  { id: 'courses', label: 'Courses I can take', follow_up_message: 'Are there any courses I can take?' },
  { id: 'next', label: 'What should I learn next?', follow_up_message: 'What should I learn next?' },
  { id: 'recommend', label: 'Recommend a course', follow_up_message: 'Recommend a course for me' },
  { id: 'progress', label: 'Show my progress', follow_up_message: 'Show me my progress' },
  { id: 'skills', label: 'Improve my skills', follow_up_message: 'Are there any courses on improving skills?' },
  { id: 'feedback', label: 'Share early access feedback', follow_up_message: 'I want to share early access feedback' },
]

function wantsFeedbackMode(message: string): boolean {
  return /share feedback|early access feedback|report a bug|beta feedback|tester feedback/i.test(message)
}

export interface SudarChatPanelProps {
  userId: string
  variant: 'floating' | 'docked'
  className?: string
  /** Empty-state chips; defaults to platform starters for floating. */
  starterChips?: ProactivePromptChoice[]
  /** Extra header content (e.g. voice orb on Journey). */
  headerSlot?: ReactNode
  /** Floating chrome: expand / close controls. */
  headerActions?: ReactNode
  /** Called when thinking / presence should update (Journey orb). */
  onPresenceChange?: (mode: 'idle' | 'listening' | 'speaking' | 'thinking') => void
  /** Force pedagogy when mounted (Journey uses guide). */
  defaultPedagogyMode?: 'explain' | 'guide' | 'exam_focus'
  /** Listen for open/follow-up events (floating always; docked Journey yes). */
  listenForOpenEvents?: boolean
  /** Cache namespace for local conversation store. */
  cacheKey?: string
  /** Emit journey canvas artifacts when route is /journey or variant is docked. */
  emitJourneyArtifacts?: boolean
  /** When set, panel sends this once after mount/update (floating open+send). */
  pendingSendMessage?: string | null
  onPendingSendConsumed?: () => void
  /** Prefill composer once (e.g. notebook custom ask after Focus study). */
  pendingDraftInput?: string | null
  onPendingDraftConsumed?: () => void
  /** Show Chats history (titled threads). Default on. */
  enableChatHistory?: boolean
  /**
   * Called once on mount with a `newSession` function.
   * Parent (JourneyWorkspace) stores it and calls it when the user wants to
   * clear both the notebook and the chat together.
   */
  onRegisterNewSession?: (fn: () => Promise<void>) => void
  /** SudarNotes pedagogical session (Journey). */
  sudarNotesSession?: import('@/types/sudarNotes').SudarNotesSessionState
  onSudarNotesSessionUpdate?: (
    session: import('@/types/sudarNotes').SudarNotesSessionState,
  ) => void
}

export function SudarChatPanel({
  userId,
  variant,
  className,
  starterChips,
  headerSlot,
  headerActions,
  onPresenceChange,
  defaultPedagogyMode,
  listenForOpenEvents = true,
  cacheKey,
  emitJourneyArtifacts,
  pendingSendMessage,
  onPendingSendConsumed,
  pendingDraftInput,
  onPendingDraftConsumed,
  enableChatHistory = true,
  onRegisterNewSession,
  sudarNotesSession,
  onSudarNotesSessionUpdate,
}: SudarChatPanelProps) {
  const { playChime } = useNotificationSound()
  const pathname = usePathname()
  const [messages, setMessages] = useState<SudarChatMessage[]>([])
  const [input, setInput] = useState('')
  const [pastedText, setPastedText] = useState('')
  const [thinking, setThinking] = useState(false)
  const [syncStatus, setSyncStatus] = useState<'idle' | 'synced' | 'reconnecting'>('idle')
  const [lastRouting, setLastRouting] = useState<RoutingMeta | null>(null)
  const [prefs, setPrefs] = useState<MascotPreferences | null>(null)
  const [pedagogyMode, setPedagogyMode] = useState<'explain' | 'guide' | 'exam_focus'>(
    defaultPedagogyMode ?? 'explain',
  )
  const [feedbackMode, setFeedbackMode] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [threads, setThreads] = useState<TutorThread[]>([])
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null)
  const [threadTitle, setThreadTitle] = useState(DEFAULT_THREAD_TITLE)
  const listRef = useRef<HTMLDivElement>(null)
  const handleSendWithMessageRef = useRef<(msg: string) => Promise<void>>(async () => {})
  const activeThreadIdRef = useRef<string | null>(null)
  const messagesRef = useRef<SudarChatMessage[]>([])
  const activeMascot = pickActiveMascot('chat_open', prefs)
  const greetingCopy = buildMascotResponse('chat_open', prefs).text

  const isTutorChatEnabled = MASCOT_ROLLOUT.surfaces.tutor_chat
  const isJourneyRoute = (pathname ?? '').includes('/journey')
  const shouldEmitArtifacts = emitJourneyArtifacts ?? (variant === 'docked' || isJourneyRoute)
  /** Journey docked chat: typographic turns, not SaaS bubbles. Floating stays bubble UI. */
  const typographicTurns = variant === 'docked' && isJourneyRoute
  const resolvedCacheKey = cacheKey ?? (variant === 'docked' ? 'journey' : 'floating')
  const chips = starterChips ?? DEFAULT_STARTUP_CHIPS
  const historyEnabled = enableChatHistory && isLocalTutorCacheEnabled()

  useEffect(() => {
    activeThreadIdRef.current = activeThreadId
  }, [activeThreadId])

  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  const sudarNotesSessionRef = useRef(sudarNotesSession)
  useEffect(() => {
    sudarNotesSessionRef.current = sudarNotesSession
  }, [sudarNotesSession])

  const onSudarNotesSessionUpdateRef = useRef(onSudarNotesSessionUpdate)
  useEffect(() => {
    onSudarNotesSessionUpdateRef.current = onSudarNotesSessionUpdate
  }, [onSudarNotesSessionUpdate])

  // Register the newChat function with the parent once (for joint session clearing).
  const onRegisterNewSessionRef = useRef(onRegisterNewSession)
  useEffect(() => {
    onRegisterNewSessionRef.current?.(() => handleNewChat())
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function refreshThreadList() {
    if (!historyEnabled) return
    const list = await listTutorThreads(userId, resolvedCacheKey)
    setThreads(list)
  }

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [messages, thinking])

  useEffect(() => {
    if (defaultPedagogyMode) setPedagogyMode(defaultPedagogyMode)
  }, [defaultPedagogyMode])

  useEffect(() => {
    if (!isLocalTutorCacheEnabled()) return
    let cancelled = false
    void (async () => {
      try {
        const thread = await ensureActiveTutorThread(userId, resolvedCacheKey)
        if (cancelled) return
        setActiveThreadId(thread.id)
        setThreadTitle(thread.title || DEFAULT_THREAD_TITLE)
        setMessages(
          thread.messages.map((m) => ({ role: m.role, content: m.content })),
        )
        const list = await listTutorThreads(userId, resolvedCacheKey)
        if (!cancelled) setThreads(list)
      } catch {
        // ignore
      }
    })()
    return () => {
      cancelled = true
    }
  }, [userId, resolvedCacheKey])

  async function persistMessages(next: SudarChatMessage[]) {
    if (!isLocalTutorCacheEnabled()) return
    const tid = activeThreadIdRef.current
    if (!tid) return
    setSyncStatus('reconnecting')
    try {
      const saved = await saveTutorThreadMessages(
        tid,
        next.map((m) => ({ role: m.role, content: m.content })),
      )
      if (saved) {
        setThreadTitle(saved.title)
        await refreshThreadList()
      }
      setSyncStatus('synced')
    } catch {
      setSyncStatus('idle')
    }
  }

  async function handleNewChat() {
    if (thinking) return
    const thread = await createTutorThread(userId, resolvedCacheKey)
    setActiveThreadId(thread.id)
    setThreadTitle(thread.title)
    setMessages([])
    setFeedbackMode(false)
    setInput('')
    setHistoryOpen(false)
    await refreshThreadList()
  }

  async function handleSelectThread(threadId: string) {
    if (thinking) return
    const list = await listTutorThreads(userId, resolvedCacheKey)
    const thread = list.find((t) => t.id === threadId)
    if (!thread) return
    setActiveTutorThreadId(resolvedCacheKey, threadId)
    setActiveThreadId(thread.id)
    setThreadTitle(thread.title)
    setMessages(thread.messages.map((m) => ({ role: m.role, content: m.content })))
    setFeedbackMode(false)
    setHistoryOpen(false)
  }

  async function handleRenameThread(threadId: string, title: string) {
    const saved = await renameTutorThread(threadId, title)
    if (!saved) return
    if (threadId === activeThreadIdRef.current) setThreadTitle(saved.title)
    await refreshThreadList()
  }

  async function handleDeleteThread(threadId: string) {
    await deleteTutorThread(threadId)
    if (threadId === activeThreadIdRef.current) {
      const remaining = (await listTutorThreads(userId, resolvedCacheKey)).filter(
        (t) => t.id !== threadId,
      )
      if (remaining[0]) {
        await handleSelectThread(remaining[0].id)
      } else {
        await handleNewChat()
      }
    } else {
      await refreshThreadList()
    }
  }

  async function handleTogglePin(threadId: string, pinned: boolean) {
    await setTutorThreadPinned(threadId, pinned)
    await refreshThreadList()
  }
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
        if (defaultPedagogyMode) return
        const d = data.preferences?.tutor_pedagogy_default
        if (d === 'explain' || d === 'guide' || d === 'exam_focus') {
          setPedagogyMode(d)
        }
      })
      .catch(() => {})
  }, [defaultPedagogyMode])

  useEffect(() => {
    if (variant !== 'docked') return
    window.dispatchEvent(new Event(CHAT_OPEN_PET_EVENT))
    void trackMascotEvent({
      eventType: 'mascot_impression',
      mascotId: activeMascot,
      source: 'tutor_chat',
      detail: { trigger: 'journey_docked' },
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount once for docked
  }, [])

  useEffect(() => {
    const msg = pendingSendMessage?.trim()
    if (!msg) return
    void handleSendWithMessageRef.current(msg)
    onPendingSendConsumed?.()
  }, [pendingSendMessage, onPendingSendConsumed])

  useEffect(() => {
    const draft = pendingDraftInput
    if (typeof draft !== 'string' || draft.length === 0) return
    setInput(draft)
    onPendingDraftConsumed?.()
  }, [pendingDraftInput, onPendingDraftConsumed])

  async function handleSendWithMessage(msg: string) {
    const trimmed = msg.trim()
    if (!trimmed || thinking) return

    if (wantsFeedbackMode(trimmed) || trimmed === 'I want to share early access feedback') {
      setFeedbackMode(true)
      const next: SudarChatMessage[] = [
        ...messagesRef.current,
        { role: 'user', content: trimmed },
        {
          role: 'assistant',
          content:
            'Thanks for helping us improve Sudar. Use the form below to describe what you found — screenshots and URLs are welcome.',
        },
      ]
      setMessages(next)
      void persistMessages(next)
      setInput('')
      return
    }

    setInput('')
    const newMessages: SudarChatMessage[] = [
      ...messagesRef.current,
      { role: 'user', content: trimmed },
    ]
    setMessages(newMessages)
    void persistMessages(newMessages)
    setThinking(true)
    onPresenceChange?.('thinking')
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
          ...(isJourneyRoute && sudarNotesSessionRef.current
            ? { sudar_notes_session: sudarNotesSessionRef.current }
            : {}),
        }),
      })
      const text = await res.text()
      const data = parseTutorQueryHttpResponse(text, res.status)
      const assistantContent =
        data.response ??
        data.error ??
        (res.ok
          ? 'I had trouble completing that answer. Please try again.'
          : `Something went wrong (${res.status}). Please try again.`)

      if (!res.ok || (data.error && !data.response)) {
        setMessages([...newMessages, { role: 'assistant', content: assistantContent }])
        return
      }
      if (data.sudar_notes?.session && onSudarNotesSessionUpdateRef.current) {
        onSudarNotesSessionUpdateRef.current(data.sudar_notes.session)
      }
      const assistantBlocks = data.blocks
      const mergedMessages: SudarChatMessage[] = [
        ...newMessages,
        {
          role: 'assistant',
          content: data.response ?? 'I had trouble completing that answer. Please try again.',
          actions: data.actions?.length ? data.actions : undefined,
          blocks: assistantBlocks,
        },
      ]
      setMessages(mergedMessages)
      tutorSucceeded = true
      setLastRouting((data.routing as RoutingMeta | undefined) ?? null)
      if (shouldEmitArtifacts && assistantBlocks?.length) {
        const canvasBlocks = assistantBlocks.filter(
          (b) =>
            (JOURNEY_CANVAS_BLOCK_TYPES as readonly string[]).includes(b.type) &&
            b.type !== 'choice_group' &&
            b.type !== 'quiz',
        )
        if (canvasBlocks.length > 0) {
          const detail: JourneyArtifactsDetail = {
            blocks: canvasBlocks,
            responsePreview: safeNotebookPreview(data.response),
            trigger: 'tutor_reply',
          }
          window.dispatchEvent(new CustomEvent(JOURNEY_ARTIFACTS_EVENT, { detail }))
        }
      }
      if (isLocalTutorCacheEnabled()) {
        void persistMessages(mergedMessages)
      }
    } catch {
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content:
            'Unable to reach Sudar. Please check your connection and try again. You can also retry with a shorter question.',
        },
      ])
    } finally {
      setThinking(false)
      onPresenceChange?.('idle')
      setPastedText('')
      if (tutorSucceeded) playChime('sudar_reply')
    }
  }

  handleSendWithMessageRef.current = handleSendWithMessage

  useEffect(() => {
    if (!listenForOpenEvents) return
    const onFollowUp = (e: Event) => {
      const detail = (e as CustomEvent<ProactiveFollowUpDetail>).detail
      const msg = detail?.message?.trim()
      if (!msg) return
      void handleSendWithMessageRef.current(msg)
    }
    const onOpenTutor = (e: Event) => {
      const detail = (e as CustomEvent<OpenTutorDetail>).detail
      if (detail?.pedagogy_mode) {
        setPedagogyMode(detail.pedagogy_mode)
      }
      const draft = detail?.draftInput
      if (typeof draft === 'string' && draft.length > 0) {
        setInput(draft)
      }
      const msg = detail?.message?.trim()
      if (msg && !detail?.openOnly) {
        void handleSendWithMessageRef.current(msg)
      }
    }
    window.addEventListener(PROACTIVE_FOLLOW_UP_EVENT, onFollowUp)
    window.addEventListener(OPEN_TUTOR_EVENT, onOpenTutor)
    return () => {
      window.removeEventListener(PROACTIVE_FOLLOW_UP_EVENT, onFollowUp)
      window.removeEventListener(OPEN_TUTOR_EVENT, onOpenTutor)
    }
  }, [listenForOpenEvents])

  async function handleSend() {
    const msg = input.trim()
    if (!msg || thinking) return
    await handleSendWithMessage(msg)
  }

  if (!isTutorChatEnabled) return null

  return (
    <div
      className={cn(
        'relative flex flex-col overflow-hidden bg-card',
        variant === 'docked'
          ? typographicTurns
            ? 'h-full min-h-0 rounded-[2px] border border-border shadow-none'
            : 'h-full min-h-0 rounded-xl border border-border shadow-sm'
          : 'liquid-glass rounded-[var(--radius-chat-panel)] shadow-2xl',
        className,
      )}
    >
      {historyEnabled && (
        <ChatHistoryPanel
          open={historyOpen}
          onClose={() => setHistoryOpen(false)}
          threads={threads}
          activeThreadId={activeThreadId}
          onSelect={(id) => void handleSelectThread(id)}
          onNewChat={() => void handleNewChat()}
          onRename={(id, title) => void handleRenameThread(id, title)}
          onDelete={(id) => void handleDeleteThread(id)}
          onTogglePin={(id, pinned) => void handleTogglePin(id, pinned)}
        />
      )}

      <div className="flex shrink-0 flex-col border-b border-border bg-card">
        {/* Identity + actions — aligned with notebook primary head row */}
        <div
          className={cn(
            'flex items-center justify-between gap-3',
            typographicTurns ? 'journey-panel-head-primary' : 'bg-card/80 px-3 py-2.5 md:px-4',
          )}
        >
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            {headerSlot ?? (
              <>
                <MascotModeBadge mascotId={activeMascot} />
                {!historyEnabled && lastRouting && (
                  <span className="rounded-pill bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                    {lastRouting.decision === 'local'
                      ? 'Local model active'
                      : lastRouting.fallback_used
                        ? 'Cloud fallback used'
                        : 'Cloud model active'}
                  </span>
                )}
              </>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-1.5">{headerActions}</div>
        </div>

        {/* Chat thread chrome — aligned with notebook tools row */}
        {historyEnabled && (
          <div
            className={cn(
              'flex items-center gap-2',
              typographicTurns
                ? 'journey-panel-head-secondary'
                : 'border-t border-border/70 bg-muted/15 px-3 py-2 md:px-4',
            )}
          >
            <button
              type="button"
              onClick={() => setHistoryOpen(true)}
              className={cn(
                'inline-flex shrink-0 items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-card-foreground',
                typographicTurns
                  ? 'journey-action-btn border border-border'
                  : 'rounded-lg border border-border bg-card hover:bg-muted',
              )}
              aria-label="Open chat history"
              title="Chats"
            >
              <History className="h-3.5 w-3.5" aria-hidden />
              Chats
            </button>
            <div className="min-w-0 flex-1 px-1">
              <p
                className={cn(
                  'truncate text-sm leading-snug text-card-foreground',
                  typographicTurns ? 'font-medium' : 'font-semibold',
                )}
                title={threadTitle}
              >
                {threadTitle}
              </p>
              <p className="truncate text-[11px] leading-snug text-muted-foreground">
                {messages.length === 0
                  ? 'Start a new conversation'
                  : `${messages.length} message${messages.length === 1 ? '' : 's'} in this chat`}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void handleNewChat()}
              disabled={thinking}
              className={cn(
                'inline-flex shrink-0 items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-card-foreground disabled:opacity-50',
                typographicTurns
                  ? 'journey-action-btn border border-border'
                  : 'rounded-lg border border-border bg-card hover:bg-muted',
              )}
              aria-label="Start a new chat"
              title="New chat"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden />
              <span className="hidden xs:inline sm:inline">New</span>
            </button>
          </div>
        )}
      </div>

      {!headerSlot && !historyEnabled && (
        <div className="flex items-center gap-3 border-b border-border/70 bg-muted/30 px-5 py-2">
          <SudarPetSprite state="idle" size={34} />
          <p className="text-xs text-muted-foreground">{SUDAR_PERSONA_VOICE.signatureLines[0]}</p>
        </div>
      )}
      {!headerSlot && historyEnabled && (
        <div className="flex items-center gap-3 border-b border-border/70 bg-muted/20 px-4 py-1.5">
          <SudarPetSprite state="idle" size={28} />
          <p className="truncate text-[11px] text-muted-foreground">
            {SUDAR_PERSONA_VOICE.signatureLines[0]}
          </p>
        </div>
      )}

      <div
        ref={listRef}
        className={cn(
          'min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 md:p-5',
          typographicTurns ? 'space-y-6' : 'space-y-4',
        )}
      >
        {messages.length === 0 && (
          <>
            {typographicTurns ? (
              <div className="chat-turn chat-turn--tutor">
                <p className="chat-turn-who">Sudar</p>
                <div className="chat-turn-body text-card-foreground">
                  Hi! I&apos;m Sudar. Tell me what you want to learn — or pick a starter below — and
                  I&apos;ll teach you step by step.
                </div>
              </div>
            ) : (
              <div className="chat-bubble border border-border bg-muted/80 text-card-foreground">
                {variant === 'docked'
                  ? `Hi! I'm Sudar. Tell me what you want to learn — or pick a starter below — and I'll teach you step by step.`
                  : `Hi! I'm Sudar. ${greetingCopy}`}
              </div>
            )}
            <p
              className={cn(
                'px-1 text-xs tracking-wider text-muted-foreground',
                typographicTurns
                  ? 'journey-mono font-normal'
                  : 'font-semibold uppercase',
              )}
            >
              {variant === 'docked' ? 'Get started' : 'Try asking'}
            </p>
            <ProactiveSudarChoiceChips
              choices={chips}
              journeyStyle={typographicTurns}
              onSelect={(c) => {
                void trackMascotEvent({
                  eventType: 'mascot_nudge_outcome',
                  mascotId: activeMascot,
                  source: 'tutor_chat',
                  detail: { nudge_type: 'startup_question', accepted: true },
                })
                if (c.id === 'feedback') {
                  setFeedbackMode(true)
                  setMessages([
                    {
                      role: 'assistant',
                      content:
                        'Thanks for helping us improve Sudar. Use the form below to describe what you found — screenshots and URLs are welcome.',
                    },
                  ])
                  return
                }
                const q = c.follow_up_message?.trim()
                if (q) void handleSendWithMessage(q)
              }}
            />
          </>
        )}
        {messages.map((m, i) => {
          const chatBlocks =
            m.role === 'assistant' && m.blocks?.length
              ? isJourneyRoute
                ? m.blocks.filter(
                    (b) =>
                      b.type === 'text' ||
                      b.type === 'choice_group' ||
                      b.type === 'quiz' ||
                      b.type === 'action_group' ||
                      b.type === 'card' ||
                      b.type === 'workflow_status' ||
                      b.type === 'external_action',
                  )
                : m.blocks
              : []
          const body = (
            <>
              {m.role === 'assistant' && chatBlocks.length > 0 ? (
                <GenerativeBlockRenderer
                  blocks={chatBlocks}
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
                  {m.role === 'assistant' ? (
                    <ChatMarkdown
                      text={normalizeTutorDisplayText(stripTutorModelArtifactsFromText(m.content))}
                    />
                  ) : (
                    m.content
                  )}
                  {m.role === 'assistant' && m.actions && m.actions.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
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
                          className={cn(
                            'inline-flex items-center gap-1.5 text-sm font-medium',
                            typographicTurns
                              ? 'journey-action-btn text-primary'
                              : 'rounded-full bg-primary/90 px-4 py-2 font-semibold text-primary-foreground shadow-md transition-colors hover:bg-primary',
                          )}
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          {action.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              )}
            </>
          )

          if (typographicTurns) {
            return (
              <div
                key={i}
                className={cn(
                  'chat-turn',
                  m.role === 'user' ? 'chat-turn--learner' : 'chat-turn--tutor',
                )}
              >
                <p className="chat-turn-who">{m.role === 'user' ? 'You' : 'Sudar'}</p>
                <div className="chat-turn-body">{body}</div>
              </div>
            )
          }

          return (
            <div key={i} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
              <div
                className={cn(
                  'flex min-w-0 flex-col gap-2',
                  m.role === 'user'
                    ? 'max-w-[min(85%,28rem)] items-end'
                    : 'max-w-[min(92%,36rem)] items-start',
                )}
              >
                <div
                  className={cn(
                    'chat-bubble',
                    m.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'border border-border bg-muted/80 text-card-foreground',
                  )}
                >
                  {body}
                </div>
              </div>
            </div>
          )
        })}
        {thinking &&
          (typographicTurns ? (
            <div className="chat-turn chat-turn--tutor">
              <p className="chat-turn-who">Sudar</p>
              <div className="chat-turn-body flex items-center gap-2 text-muted-foreground">
                <SudarInlineLoader size="sm" className="shrink-0" />
                <span>Thinking…</span>
              </div>
            </div>
          ) : (
            <div className="flex justify-start">
              <div className="chat-bubble flex items-center gap-2 border border-border bg-muted/80 text-card-foreground">
                <SudarInlineLoader size="sm" className="shrink-0" />
                <span>Thinking…</span>
              </div>
            </div>
          ))}
      </div>

      <div className="shrink-0 border-t border-border bg-card/80 p-4 md:p-5">
        {feedbackMode ? (
          <EarlyAccessFeedbackPanel
            surface="learn"
            pageRoute={pathname ?? '/'}
            onCancel={() => setFeedbackMode(false)}
            onSubmitted={(thankYou) => {
              setFeedbackMode(false)
              setMessages((prev) => [...prev, { role: 'assistant', content: thankYou }])
            }}
          />
        ) : (
          <>
            {pastedText.length > 0 && (
              <div className="mb-2 rounded-lg border border-border bg-card/80 p-2">
                <p className="mb-1 text-[10px] text-muted-foreground">
                  Pasted text ({pastedText.length} chars) — will be sent with your message
                </p>
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
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && void handleSend()}
                className={cn(
                  'w-full border border-border bg-transparent py-3 text-sm text-card-foreground placeholder:text-muted-foreground transition-all focus:outline-none',
                  typographicTurns
                    ? 'rounded-[2px] px-3 pr-24 focus:border-primary'
                    : 'rounded-pill bg-card/80 px-5 pr-14 focus:ring-2 focus:ring-primary/20',
                )}
              />
              <button
                type="button"
                onClick={() => void handleSend()}
                disabled={!input.trim() || thinking}
                className={cn(
                  'absolute right-1.5 top-1/2 flex shrink-0 -translate-y-1/2 items-center justify-center disabled:opacity-50',
                  typographicTurns
                    ? 'journey-mono h-9 rounded-[2px] bg-card-foreground px-3 text-[11px] uppercase tracking-wide text-background hover:bg-primary hover:text-primary-foreground'
                    : 'h-10 w-10 rounded-pill bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 disabled:hover:scale-100',
                )}
                aria-label="Send"
              >
                {typographicTurns ? 'Send' : <Send className="h-4 w-4" />}
              </button>
            </div>
            {variant === 'floating' && (
              <div className="mt-2">
                <textarea
                  placeholder='Paste text here to summarize or extract key terms (then type e.g. "Summarize this" and send)'
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  className="max-h-[120px] min-h-[56px] w-full resize-y rounded-lg border border-border bg-card/80 px-3 py-2 text-xs text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  rows={2}
                />
              </div>
            )}
            <div
              className={cn(
                'mt-3',
                typographicTurns
                  ? 'journey-panel-foot'
                  : 'flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between',
              )}
            >
              <Link
                href="/help"
                className={cn(
                  'shrink-0 hover:text-card-foreground hover:underline',
                  typographicTurns ? 'text-[10px] text-muted-foreground' : 'text-[10px] font-medium text-primary',
                )}
              >
                Sudar Help Center
              </Link>
              <p
                className={cn(
                  typographicTurns
                    ? 'journey-panel-foot-note text-[10px] text-muted-foreground'
                    : 'text-[10px] leading-relaxed text-muted-foreground sm:text-right',
                )}
              >
                Sudar is for learning. Do not paste passwords, card numbers, or private keys.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
