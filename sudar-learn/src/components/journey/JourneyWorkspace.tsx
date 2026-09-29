'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import {
  ArrowLeft,
  ChevronRight,
  Mic,
  MicOff,
  PanelRightClose,
  PanelRightOpen,
  RefreshCw,
} from 'lucide-react'
import { SudarLogoMark } from '@/components/branding/SudarLogo'
import { LearnWithSudarMark } from '@/components/branding/LearnWithSudarMark'
import { LearningNotebook } from '@/components/journey/LearningNotebook'
import { JOURNEY_ARTIFACTS_EVENT, type JourneyArtifactsDetail } from '@/lib/tutor/proactiveEvents'
import {
  clearNotebookState,
  loadNotebookPages,
  loadWorkingMemory,
  saveNotebookPages,
  saveWorkingMemory,
} from '@/lib/journey/notebookStorage'
import {
  clearSudarNotesSession,
  loadSudarNotesSession,
  saveSudarNotesSession,
} from '@/lib/sudarNotes/sessionClient'
import type { NotebookPage } from '@/types/journeyNotebook'
import type { SudarNotesSessionState, SudarNotesWorkingMemory } from '@/types/sudarNotes'
import { emptySudarNotesSession, emptyWorkingMemory } from '@/types/sudarNotes'
import type { ProactivePromptChoice, TutorBlock } from '@/types/tutor'
import { SudarVoiceOrb, type VoiceOrbMode } from './SudarVoiceOrb'
import { cn, safeNotebookPreview } from '@/lib/utils'

const SudarChatPanel = dynamic(
  () => import('@/components/tutor/SudarChatPanel').then((m) => m.SudarChatPanel),
  { ssr: false },
)

const CHAT_COLLAPSE_KEY = 'sudar.journey.chatCollapsed'

const JOURNEY_STARTERS: ProactivePromptChoice[] = [
  {
    id: 'goal',
    label: 'Start a study goal',
    follow_up_message:
      'I want to get better at something. Ask what I care about and my experience level before teaching.',
  },
  {
    id: 'socratic',
    label: 'Socratic study session',
    follow_up_message:
      'Let us study together. Ask what I already know first, then teach with questions before long explanations.',
  },
  {
    id: 'catchup',
    label: 'Help me catch up',
    follow_up_message:
      'I feel behind on a subject. Ask what I am studying, figure out where I am stuck, then help me catch up.',
  },
  {
    id: 'check',
    label: 'Check my understanding',
    follow_up_message:
      'Give me a soft explain-it-back check on what we have been studying — no formal quiz vibe.',
  },
  {
    id: 'resources',
    label: 'Find video & reading',
    follow_up_message:
      'Find a short YouTube explainer and one good article for what we are studying. Put them in my notebook as verified resources.',
  },
]

interface JourneyWorkspaceProps {
  userId: string
}

function presenceLabel(mode: VoiceOrbMode): string {
  if (mode === 'thinking') return 'Thinking…'
  if (mode === 'listening') return 'Listening…'
  if (mode === 'speaking') return 'Speaking…'
  return 'Ready when you are'
}

export function JourneyWorkspace({ userId }: JourneyWorkspaceProps) {
  const [pages, setPages] = useState<NotebookPage[]>([])
  const [workingMemory, setWorkingMemory] = useState<SudarNotesWorkingMemory>(emptyWorkingMemory())
  const [session, setSession] = useState<SudarNotesSessionState>(emptySudarNotesSession())
  const [notebookHydrated, setNotebookHydrated] = useState(false)
  const [presence, setPresence] = useState<VoiceOrbMode>('idle')
  const [voiceOn, setVoiceOn] = useState(false)
  const [chatCollapsed, setChatCollapsed] = useState(false)
  const [pendingSend, setPendingSend] = useState<string | null>(null)
  const [pendingDraft, setPendingDraft] = useState<string | null>(null)
  const newChatFnRef = useRef<(() => Promise<void>) | null>(null)

  useEffect(() => {
    try {
      if (sessionStorage.getItem(CHAT_COLLAPSE_KEY) === '1') {
        setChatCollapsed(true)
      }
    } catch {
      // ignore
    }
    setPages(loadNotebookPages())
    setWorkingMemory(loadWorkingMemory())
    setSession(loadSudarNotesSession())
    setNotebookHydrated(true)
  }, [])

  useEffect(() => {
    try {
      sessionStorage.setItem(CHAT_COLLAPSE_KEY, chatCollapsed ? '1' : '0')
    } catch {
      // ignore
    }
  }, [chatCollapsed])

  useEffect(() => {
    if (!notebookHydrated) return
    saveNotebookPages(pages)
  }, [pages, notebookHydrated])

  useEffect(() => {
    if (!notebookHydrated) return
    saveWorkingMemory(workingMemory)
  }, [workingMemory, notebookHydrated])

  useEffect(() => {
    if (!notebookHydrated) return
    saveSudarNotesSession(session)
  }, [session, notebookHydrated])

  useEffect(() => {
    const onArtifacts = (e: Event) => {
      const detail = (e as CustomEvent<JourneyArtifactsDetail>).detail
      if (!detail?.blocks?.length) return
      setPresence('thinking')
      // Pin durable cards as suggested (learner-owned); skip chat-only choice/quiz chrome.
      const durable = detail.blocks.filter(
        (b) => b.type !== 'choice_group' && b.type !== 'quiz' && b.type !== 'action_group',
      )
      if (durable.length === 0) {
        window.setTimeout(() => setPresence(voiceOn ? 'listening' : 'idle'), 400)
        return
      }
      setPages((prev) => [
        ...prev,
        {
          id: `art-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          createdAt: Date.now(),
          source: 'sudar' as const,
          status: 'suggested',
          blocks: durable,
          preview: safeNotebookPreview(detail.responsePreview),
        },
      ])
      window.setTimeout(() => setPresence(voiceOn ? 'listening' : 'idle'), 700)
    }
    window.addEventListener(JOURNEY_ARTIFACTS_EVENT, onArtifacts)
    return () => window.removeEventListener(JOURNEY_ARTIFACTS_EVENT, onArtifacts)
  }, [voiceOn])

  function toggleVoice() {
    if (voiceOn) {
      setVoiceOn(false)
      setPresence('idle')
      return
    }
    setVoiceOn(true)
    setPresence('listening')
  }

  const ensureChatOpen = useCallback(() => {
    setChatCollapsed(false)
  }, [])

  const onAskFromSelection = useCallback(
    (action: string, selectedText: string) => {
      ensureChatOpen()
      setPendingSend(`${action}: "${selectedText}"`)
    },
    [ensureChatOpen],
  )

  const onCustomAsk = useCallback(
    (selectedText: string) => {
      ensureChatOpen()
      const excerpt = selectedText.slice(0, 80) + (selectedText.length > 80 ? '…' : '')
      setPendingDraft(`About "${excerpt}": `)
    },
    [ensureChatOpen],
  )

  const onAskSudar = useCallback(
    (message: string) => {
      ensureChatOpen()
      setPendingSend(message)
    },
    [ensureChatOpen],
  )

  const onAddGeneratedPage = useCallback((blocks: TutorBlock[], preview: string) => {
    setPages((prev) => [
      ...prev,
      {
        id: `gen-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        createdAt: Date.now(),
        source: 'sudar' as const,
        status: 'accepted',
        blocks,
        preview,
      },
    ])
  }, [])

  function addNote() {
    setPages((prev) => [
      ...prev,
      {
        id: `note-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        createdAt: Date.now(),
        source: 'note',
        status: 'accepted',
        noteText: '',
      },
    ])
  }

  function updateNote(pageId: string, noteText: string) {
    setPages((prev) =>
      prev.map((p) =>
        p.id === pageId
          ? { ...p, noteText, status: p.status === 'suggested' ? 'edited' : p.status ?? 'edited', updatedAt: Date.now() }
          : p,
      ),
    )
  }

  function acceptPage(pageId: string) {
    setPages((prev) =>
      prev.map((p) =>
        p.id === pageId ? { ...p, status: 'accepted', updatedAt: Date.now() } : p,
      ),
    )
  }

  function dismissPage(pageId: string) {
    setPages((prev) =>
      prev.map((p) =>
        p.id === pageId ? { ...p, status: 'dismissed', updatedAt: Date.now() } : p,
      ),
    )
  }

  const onSudarNotesSessionUpdate = useCallback((next: SudarNotesSessionState) => {
    setSession(next)
    setWorkingMemory(next.working_memory)
  }, [])

  async function handleNewSession() {
    clearNotebookState()
    clearSudarNotesSession()
    setPages([])
    setWorkingMemory(emptyWorkingMemory())
    setSession(emptySudarNotesSession())
    if (newChatFnRef.current) await newChatFnRef.current()
    setChatCollapsed(false)
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-2 overflow-hidden md:gap-3" data-sudar-journey>
      <header className="shrink-0 border-b border-border pb-4">
        <div className="mb-3 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-card-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
            Back to my learning
          </Link>
          <button
            type="button"
            onClick={() => void handleNewSession()}
            className="journey-action-btn inline-flex items-center gap-1.5"
            title="Clear the notebook and start a fresh conversation"
            aria-label="New session — clear notebook and start a fresh chat"
          >
            <RefreshCw className="h-3 w-3" aria-hidden />
            New session
          </button>
        </div>
        <div className="flex items-start gap-3">
          <LearnWithSudarMark
            className="mt-0.5 h-9 w-9 shrink-0 md:h-10 md:w-10"
            starFill="var(--background)"
          />
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-medium tracking-tight text-card-foreground md:text-2xl">
              SudarNotes
            </h1>
            <p className="mt-1 max-w-2xl text-sm leading-snug text-muted-foreground">
              A personal tutor in conversation — suggested notes you own, soft checks, lasting
              understanding.
            </p>
          </div>
        </div>
      </header>

      <div
        className={cn(
          'grid min-h-0 flex-1 gap-3 overflow-hidden md:gap-4',
          chatCollapsed
            ? 'grid-rows-1 lg:grid-cols-[minmax(0,1fr)_3.5rem]'
            : 'grid-rows-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:grid-rows-none lg:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.95fr)]',
        )}
      >
        <LearningNotebook
          pages={pages}
          workingMemory={workingMemory}
          onClear={() => {
            setPages([])
            setWorkingMemory(emptyWorkingMemory())
          }}
          onAddNote={addNote}
          onUpdateNote={updateNote}
          onAcceptPage={acceptPage}
          onDismissPage={dismissPage}
          onAskFromSelection={onAskFromSelection}
          onCustomAsk={onCustomAsk}
          onAskSudar={onAskSudar}
          onAddGeneratedPage={onAddGeneratedPage}
          chatCollapsed={chatCollapsed}
          onExpandChat={ensureChatOpen}
        />

        {chatCollapsed ? (
          <aside
            className="hidden min-h-0 flex-col items-center overflow-hidden rounded-[2px] border border-border bg-card py-3 lg:flex"
            aria-label="Sudar chat collapsed"
          >
            <button
              type="button"
              onClick={() => setChatCollapsed(false)}
              className="flex flex-1 flex-col items-center gap-3 px-1 text-muted-foreground transition-colors hover:text-card-foreground"
              aria-label="Expand chat with Sudar"
              title="Chat with Sudar"
            >
              <SudarLogoMark className="h-8 w-auto text-primary" starFill="var(--card)" />
              {voiceOn && (
                <span className="journey-live-dot" data-live="true" aria-label="Voice on" />
              )}
              <span
                className="mt-auto writing-mode-vertical text-[10px] font-semibold uppercase tracking-wider"
                style={{ writingMode: 'vertical-rl' }}
              >
                Sudar
              </span>
              <ChevronRight className="h-4 w-4 rotate-180" aria-hidden />
            </button>
          </aside>
        ) : (
          <section className="flex min-h-0 flex-col overflow-hidden" aria-label="Sudar tutor">
            <SudarChatPanel
              userId={userId}
              variant="docked"
              className="h-full min-h-0"
              starterChips={JOURNEY_STARTERS}
              defaultPedagogyMode="guide"
              listenForOpenEvents
              emitJourneyArtifacts
              sudarNotesSession={session}
              onSudarNotesSessionUpdate={onSudarNotesSessionUpdate}
              onPresenceChange={setPresence}
              pendingSendMessage={pendingSend}
              onPendingSendConsumed={() => setPendingSend(null)}
              pendingDraftInput={pendingDraft}
              onPendingDraftConsumed={() => setPendingDraft(null)}
              onRegisterNewSession={(fn) => {
                newChatFnRef.current = fn
              }}
              headerSlot={
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  {voiceOn ? (
                    <SudarVoiceOrb mode={presence} reactive />
                  ) : (
                    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[2px] border border-border bg-card p-1">
                      <SudarLogoMark className="h-7 w-auto text-primary" starFill="var(--card)" />
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="journey-mono text-[11px] text-muted-foreground">Sudar</p>
                    <p
                      className="flex items-center gap-1.5 text-sm font-medium leading-snug text-card-foreground"
                      aria-live="polite"
                    >
                      <span
                        className="journey-live-dot"
                        data-live={
                          presence === 'listening' ||
                          presence === 'thinking' ||
                          presence === 'speaking'
                            ? 'true'
                            : 'false'
                        }
                        aria-hidden
                      />
                      {presenceLabel(presence)}
                    </p>
                  </div>
                </div>
              }
              headerActions={
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={toggleVoice}
                    className={cn(
                      'journey-action-btn inline-flex items-center gap-1.5',
                      voiceOn && 'border-primary text-card-foreground',
                    )}
                    aria-pressed={voiceOn}
                    aria-label={voiceOn ? 'Turn voice presence off' : 'Turn voice presence on'}
                  >
                    {voiceOn ? (
                      <Mic className="h-3.5 w-3.5" aria-hidden />
                    ) : (
                      <MicOff className="h-3.5 w-3.5" aria-hidden />
                    )}
                    <span className="hidden sm:inline">Voice</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setChatCollapsed(true)}
                    className="journey-action-btn inline-flex items-center gap-1.5"
                    aria-label="Focus on your notebook"
                    title="Focus study"
                  >
                    <PanelRightClose className="h-3.5 w-3.5" aria-hidden />
                    <span className="hidden md:inline">Focus</span>
                  </button>
                </div>
              }
            />
          </section>
        )}
      </div>

      {chatCollapsed && (
        <button
          type="button"
          onClick={() => setChatCollapsed(false)}
          className="fixed bottom-4 right-4 z-40 inline-flex items-center gap-2 rounded-[2px] border border-border bg-card px-3 py-2 text-xs font-medium text-card-foreground lg:hidden"
          aria-label="Open chat with Sudar"
        >
          <PanelRightOpen className="h-3.5 w-3.5" aria-hidden />
          Chat
        </button>
      )}
    </div>
  )
}
