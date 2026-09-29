'use client'

import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { Mic, Square } from 'lucide-react'
import { CrmOverlayCanvas } from './CrmOverlayCanvas'
import { SimCoachReport } from './SimCoachReport'
import { SimCoachReflection } from './SimCoachReflection'
import { SimVoiceShell, type VoiceConfig } from './SimVoiceShell'
import type { SimCrmSkin, SimPersonaState } from '@shared-sudarsim/schemas'
import '@livekit/components-styles'

type Channel = 'phone' | 'chat' | 'email'

type VoiceUiState = 'idle' | 'recording' | 'thinking' | 'speaking'

type ScenarioPayload = {
  id: string
  title: string
  locale: string
  persona: { name?: string; opening_line?: string }
  channels: { phone?: boolean; chat?: boolean; email?: boolean }
  crm_skin: SimCrmSkin | null
  completion_rule?: { enabled?: boolean }
}

type ChatMessage = { role: string; text: string; channel: Channel }

const PREFERRED_AUDIO_TYPES = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'] as const

function pickRecorderMime(): string | undefined {
  if (typeof MediaRecorder === 'undefined') return undefined
  return PREFERRED_AUDIO_TYPES.find((t) => MediaRecorder.isTypeSupported(t))
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const result = reader.result
      if (typeof result !== 'string') {
        reject(new Error('Failed to read audio'))
        return
      }
      const comma = result.indexOf(',')
      resolve(comma >= 0 ? result.slice(comma + 1) : result)
    }
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read audio'))
    reader.readAsDataURL(blob)
  })
}

function playCustomerAudio(audioBase64: string, audioMime: string | null | undefined): Promise<void> {
  return new Promise((resolve) => {
    const mime = audioMime?.trim() || 'audio/mpeg'
    const audio = new Audio(`data:${mime};base64,${audioBase64}`)
    const finish = () => resolve()
    audio.onended = finish
    audio.onerror = finish
    void audio.play().catch(finish)
  })
}

function voiceStatusLabel(state: VoiceUiState): string {
  switch (state) {
    case 'recording':
      return 'Recording… release to send'
    case 'thinking':
      return 'Sudar is thinking…'
    case 'speaking':
      return 'Customer speaking…'
    default:
      return 'Hold mic to talk, or type below'
  }
}

function micErrorMessage(err: unknown): string {
  if (err instanceof DOMException) {
    if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
      return 'Microphone blocked. Check browser site permissions (lock icon in address bar) and allow mic for localhost, then reload.'
    }
    if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
      return 'No microphone found. Connect a mic or type your reply.'
    }
    if (err.name === 'NotReadableError') {
      return 'Microphone is in use by another app. Close other apps using the mic and try again.'
    }
    if (err.name === 'SecurityError') {
      return 'Microphone requires a secure context (HTTPS or localhost).'
    }
    return `Microphone error: ${err.message}`
  }
  return 'Could not access microphone. Type your reply instead.'
}

function parseTurnError(data: { error?: unknown; detail?: unknown }, fallback: string): string {
  if (typeof data.error === 'string' && data.error.trim()) {
    try {
      const inner = JSON.parse(data.error) as { detail?: string }
      if (typeof inner.detail === 'string') return inner.detail
    } catch {
      return data.error
    }
    return data.error
  }
  if (typeof data.detail === 'string' && data.detail.trim()) return data.detail
  if (data.error && typeof data.error === 'object') {
    const flattened = data.error as { formErrors?: string[] }
    if (flattened.formErrors?.[0]) return flattened.formErrors[0]
  }
  return fallback
}

export function SimWorkspace({
  sessionId,
  scenario,
  initialPersonaState,
  voice: initialVoice,
  moduleId,
  courseId,
  onCompleteModule,
}: {
  sessionId: string
  scenario: ScenarioPayload
  initialPersonaState: SimPersonaState
  voice?: VoiceConfig | null
  moduleId?: string
  courseId?: string
  onCompleteModule?: () => void
}) {
  const channels: Channel[] = (['phone', 'chat', 'email'] as Channel[]).filter(
    (c) => scenario.channels?.[c] !== false,
  )
  const [activeChannel, setActiveChannel] = useState<Channel>(channels[0] ?? 'phone')
  const [personaState, setPersonaState] = useState(initialPersonaState)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [voiceState, setVoiceState] = useState<VoiceUiState>('idle')
  const [voiceError, setVoiceError] = useState<string | null>(null)
  const [useVoiceShell, setUseVoiceShell] = useState(Boolean(initialVoice?.token && initialVoice?.livekit_url))
  const [phase, setPhase] = useState<'sim' | 'reflection' | 'coach'>('sim')
  const [coachResult, setCoachResult] = useState<Record<string, unknown> | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const holdActiveRef = useRef(false)
  const suppressClickRef = useRef(false)

  useEffect(() => {
    fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_type: 'sim_start',
        course_id: courseId,
        module_id: moduleId,
        modality: 'sudarsim',
        payload: { session_id: sessionId, scenario_id: scenario.id, voice_mode: useVoiceShell },
      }),
    }).catch(() => {})
  }, [sessionId, scenario.id, courseId, moduleId, useVoiceShell])

  useEffect(() => {
    if (scenario.persona?.opening_line && messages.length === 0) {
      setMessages([{ role: 'customer', text: scenario.persona.opening_line, channel: 'phone' }])
    }
  }, [scenario.persona?.opening_line, messages.length])

  useEffect(() => {
    return () => {
      mediaRecorderRef.current?.stop()
      mediaStreamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  const mergeVoiceTranscript = useCallback((voiceMessages: { role: string; text: string }[]) => {
    setMessages((prev) => {
      const phoneMsgs = voiceMessages.map((m) => ({
        role: m.role,
        text: m.text,
        channel: 'phone' as Channel,
      }))
      const other = prev.filter((m) => m.channel !== 'phone')
      return [...phoneMsgs, ...other]
    })
  }, [])

  const sendTurn = useCallback(
    async (payload: { text?: string; audio_base64?: string; audio_mime?: string }, channel: Channel) => {
      const hasText = Boolean(payload.text?.trim())
      const hasAudio = Boolean(payload.audio_base64?.trim())
      if (!hasText && !hasAudio) return

      setLoading(true)
      setVoiceState('thinking')
      setVoiceError(null)

      if (hasText && payload.text) {
        setMessages((m) => [...m, { role: 'learner', text: payload.text!, channel }])
      }

      try {
        const res = await fetch(`/api/sim/session/${sessionId}?action=turn`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            channel,
            ...(hasText ? { text: payload.text } : {}),
            ...(hasAudio
              ? { audio_base64: payload.audio_base64, audio_mime: payload.audio_mime ?? 'audio/webm' }
              : {}),
          }),
        })
        const data = (await res.json()) as {
          success?: boolean
          reply?: string
          persona_state?: SimPersonaState
          learner_text?: string
          audio_base64?: string | null
          audio_mime?: string | null
          error?: string | { formErrors?: string[] }
          detail?: string
        }

        if (!data.success) {
          setVoiceError(parseTurnError(data, 'Turn failed'))
          setVoiceState('idle')
          setLoading(false)
          return
        }

        if (hasAudio && data.learner_text) {
          setMessages((m) => [...m, { role: 'learner', text: data.learner_text!, channel }])
        }

        if (data.reply) {
          setMessages((m) => [...m, { role: 'customer', text: data.reply!, channel }])
        }
        if (data.persona_state) setPersonaState(data.persona_state)

        if (data.audio_base64) {
          setVoiceState('speaking')
          await playCustomerAudio(data.audio_base64, data.audio_mime)
        }
      } catch {
        setVoiceError('Could not reach Sudar. Check your connection and try again.')
      }

      setVoiceState('idle')
      setLoading(false)
    },
    [sessionId],
  )

  const stopRecordingAndSend = useCallback(async () => {
    const recorder = mediaRecorderRef.current
    if (!recorder || recorder.state === 'inactive') {
      setVoiceState('idle')
      return
    }

    await new Promise<void>((resolve) => {
      recorder.onstop = () => resolve()
      recorder.stop()
    })

    const mime = recorder.mimeType || 'audio/webm'
    const blob = new Blob(chunksRef.current, { type: mime })
    chunksRef.current = []
    mediaRecorderRef.current = null

    if (blob.size < 200) {
      setVoiceError('Recording too short. Hold the mic a bit longer.')
      setVoiceState('idle')
      return
    }

    try {
      const audio_base64 = await blobToBase64(blob)
      await sendTurn({ audio_base64, audio_mime: mime }, 'phone')
    } catch {
      setVoiceError('Could not process recording.')
      setVoiceState('idle')
    }
  }, [sendTurn])

  const startRecording = useCallback(async () => {
    if (loading || voiceState === 'recording' || voiceState === 'thinking' || voiceState === 'speaking') {
      return
    }
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setVoiceError('Microphone not supported in this browser. Type your reply instead.')
      return
    }

    setVoiceError(null)
    try {
      if (!mediaStreamRef.current?.active) {
        mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        })
      }
      const stream = mediaStreamRef.current
      const mime = pickRecorderMime()
      const recorder = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream)
      mediaRecorderRef.current = recorder
      chunksRef.current = []
      recorder.ondataavailable = (ev) => {
        if (ev.data.size > 0) chunksRef.current.push(ev.data)
      }
      recorder.start(250)
      setVoiceState('recording')
    } catch (err) {
      setVoiceError(micErrorMessage(err))
      setVoiceState('idle')
    }
  }, [loading, voiceState])

  const onMicPointerDown = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (activeChannel !== 'phone' || loading || useVoiceShell) return
    if (e.pointerType === 'mouse' && e.button !== 0) return
    e.preventDefault()
    suppressClickRef.current = true
    holdActiveRef.current = true
    void startRecording()
  }

  const onMicPointerUp = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (!holdActiveRef.current) return
    e.preventDefault()
    holdActiveRef.current = false
    if (mediaRecorderRef.current?.state === 'recording') {
      void stopRecordingAndSend()
    }
  }

  const onMicClickToggle = () => {
    if (activeChannel !== 'phone' || loading || useVoiceShell) return
    if (suppressClickRef.current) {
      suppressClickRef.current = false
      return
    }
    if (voiceState === 'recording') {
      void stopRecordingAndSend()
      return
    }
    if (voiceState === 'idle') {
      void startRecording()
    }
  }

  const handleCrmAction = async (overlayId: string, action: string, value?: string) => {
    await fetch(`/api/sim/session/${sessionId}?action=crm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ overlay_id: overlayId, action, value }),
    })
  }

  const completeSession = async (reflection?: string) => {
    setLoading(true)
    const res = await fetch(`/api/sim/session/${sessionId}?action=complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reflection ? { reflection } : {}),
    })
    const data = await res.json()
    setCoachResult(data.coach ?? null)
    setPhase('coach')
    setLoading(false)

    await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_type: 'sim_complete',
        course_id: courseId,
        module_id: moduleId,
        modality: 'sudarsim',
        payload: { session_id: sessionId, passed: data.coach?.passed },
      }),
    })

    if (data.coach?.passed && scenario.completion_rule?.enabled) {
      onCompleteModule?.()
    }
  }

  const endSession = () => setPhase('reflection')

  if (phase === 'reflection') {
    return (
      <SimCoachReflection
        loading={loading}
        onSubmit={(reflection) => void completeSession(reflection)}
        onSkip={() => void completeSession()}
      />
    )
  }

  if (phase === 'coach' && coachResult) {
    return (
      <SimCoachReport
        result={coachResult as never}
        onRetry={() => window.location.reload()}
        onContinue={onCompleteModule}
      />
    )
  }

  const micBusy = loading || voiceState === 'thinking' || voiceState === 'speaking'

  return (
    <div className="flex h-full min-h-[70vh] flex-col gap-4 lg:flex-row">
      <div className="flex flex-1 flex-col rounded-xl border border-border bg-card">
        <div className="flex border-b border-border">
          {channels.map((ch) => (
            <button
              key={ch}
              type="button"
              onClick={() => {
                setActiveChannel(ch)
                fetch('/api/events', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    event_type: 'sim_channel_switch',
                    course_id: courseId,
                    module_id: moduleId,
                    modality: 'sudarsim',
                    payload: { channel: ch },
                  }),
                }).catch(() => {})
              }}
              className={`flex-1 px-4 py-3 text-sm font-medium capitalize ${
                activeChannel === ch ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'
              }`}
            >
              {ch}
            </button>
          ))}
        </div>

        <div className="flex flex-1 flex-col p-4">
          <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
            <span>Customer: {scenario.persona?.name ?? 'Customer'}</span>
            <span>
              Mood {Math.round(personaState.mood * 100)}% · Trust {Math.round(personaState.trust * 100)}%
            </span>
          </div>

          <div
            className="flex-1 space-y-2 overflow-y-auto rounded-lg bg-muted/30 p-3 dark:bg-muted/20"
            role="log"
            aria-live="polite"
            aria-relevant="additions"
          >
            {messages
              .filter((m) => m.channel === activeChannel || activeChannel === 'phone')
              .map((m, i) => (
                <div
                  key={i}
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                    m.role === 'learner'
                      ? 'ml-auto bg-primary text-primary-foreground'
                      : 'border border-border bg-background'
                  }`}
                >
                  {m.text}
                </div>
              ))}
          </div>

          {activeChannel === 'phone' && useVoiceShell ? (
            <div className="mt-3">
              <SimVoiceShell
                sessionId={sessionId}
                voice={initialVoice ?? null}
                customerName={scenario.persona?.name ?? 'Customer'}
        onTranscriptUpdate={mergeVoiceTranscript}
        onFallback={() => setUseVoiceShell(false)}
              />
            </div>
          ) : null}

          {activeChannel === 'phone' && !useVoiceShell ? (
            <div className="mt-3 flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
              <button
                type="button"
                disabled={micBusy}
                onPointerDown={onMicPointerDown}
                onPointerUp={onMicPointerUp}
                onPointerLeave={onMicPointerUp}
                onPointerCancel={onMicPointerUp}
                onClick={onMicClickToggle}
                onKeyDown={(e) => {
                  if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault()
                    onMicClickToggle()
                  }
                }}
                aria-label={
                  voiceState === 'recording'
                    ? 'Stop recording and send'
                    : 'Hold to talk, or press to toggle recording'
                }
                aria-pressed={voiceState === 'recording'}
                className={`flex h-14 w-14 items-center justify-center rounded-full border-2 transition-colors touch-none select-none disabled:opacity-50 ${
                  voiceState === 'recording'
                    ? 'border-destructive bg-destructive text-destructive-foreground'
                    : 'border-primary bg-primary/10 text-primary hover:bg-primary/20 dark:bg-primary/20'
                }`}
              >
                {voiceState === 'recording' ? (
                  <Square className="h-5 w-5" aria-hidden />
                ) : (
                  <Mic className="h-6 w-6" aria-hidden />
                )}
              </button>
              <p className="text-center text-xs text-muted-foreground sm:text-left" aria-live="polite">
                {voiceStatusLabel(voiceState)}
              </p>
            </div>
          ) : null}

          {voiceError ? (
            <p className="mt-2 text-center text-xs text-destructive" role="alert">
              {voiceError}
            </p>
          ) : null}

          <form
            className="mt-3 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              const text = input.trim()
              if (!text || loading) return
              setInput('')
              void sendTurn({ text }, activeChannel)
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm disabled:opacity-50"
              placeholder={
                activeChannel === 'email'
                  ? 'Compose reply…'
                  : activeChannel === 'phone'
                    ? 'Type a reply (or use voice)…'
                    : 'Type your message…'
              }
              aria-label="Message input"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              Send
            </button>
          </form>

          <button
            type="button"
            onClick={endSession}
            disabled={loading}
            className="mt-3 rounded-lg border border-border py-2 text-sm font-medium hover:bg-muted"
          >
            End simulation & get coach feedback
          </button>
        </div>
      </div>

      {scenario.crm_skin ? (
        <div className="w-full lg:w-[45%]">
          <h3 className="mb-2 text-sm font-medium text-foreground">CRM workspace</h3>
          <CrmOverlayCanvas skin={scenario.crm_skin} onAction={handleCrmAction} />
        </div>
      ) : null}
    </div>
  )
}
