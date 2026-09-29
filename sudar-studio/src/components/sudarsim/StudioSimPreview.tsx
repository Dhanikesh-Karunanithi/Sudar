'use client'

import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { Loader2, Mic, X } from 'lucide-react'
import type { SimCrmSkin, SimPersonaState } from '@/types/sudarsim'
import { buildPreviewTurnPayload } from '@/lib/sudarsim/previewPayload'
import { initialPersonaStateFromScenario } from '@/lib/sudarsim/previewState'
import { useSimVoiceCapture } from '@/hooks/useSimVoiceCapture'
import { useSimVoicePlayer } from '@/hooks/useSimVoicePlayer'

type Channel = 'phone' | 'chat' | 'email'
type VoiceStage = 'idle' | 'recording' | 'transcribing' | 'thinking' | 'speaking'
type ChatMessage = { role: 'learner' | 'customer'; text: string; channel: Channel }

function parseApiError(data: { error?: unknown; detail?: unknown }): string {
  if (typeof data.error === 'string' && data.error.trim()) return data.error
  if (typeof data.detail === 'string' && data.detail.trim()) return data.detail
  return 'Turn failed'
}

function stageLabel(stage: VoiceStage): string {
  switch (stage) {
    case 'recording':
      return 'Recording… release to send'
    case 'transcribing':
      return 'Transcribing…'
    case 'thinking':
      return 'Customer thinking…'
    case 'speaking':
      return 'Customer speaking…'
    default:
      return 'Hold mic to talk — or type below'
  }
}

export function StudioSimPreview({
  scenario,
  crmSkin,
  onClose,
}: {
  scenario: Record<string, unknown>
  crmSkin?: SimCrmSkin | null
  onClose: () => void
}) {
  const persona = scenario.persona as { name?: string; opening_line?: string; voice_id?: string } | undefined
  const channels: Channel[] = (['phone', 'chat', 'email'] as Channel[]).filter(
    (c) => (scenario.channels as Record<string, boolean> | undefined)?.[c] !== false,
  )
  const locale = typeof scenario.locale === 'string' ? scenario.locale : 'en'
  const voiceId = typeof persona?.voice_id === 'string' ? persona.voice_id.trim() : undefined

  const [activeChannel, setActiveChannel] = useState<Channel>(channels[0] ?? 'phone')
  const [personaState, setPersonaState] = useState<SimPersonaState>(() =>
    initialPersonaStateFromScenario(scenario),
  )
  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    persona?.opening_line
      ? [{ role: 'customer', text: persona.opening_line, channel: 'phone' }]
      : [],
  )
  const [input, setInput] = useState('')
  const [voiceStage, setVoiceStage] = useState<VoiceStage>('idle')
  const [voiceError, setVoiceError] = useState<string | null>(null)
  const [ttsWarning, setTtsWarning] = useState<string | null>(null)
  const [showMicEnable, setShowMicEnable] = useState(true)
  const [openingPlayed, setOpeningPlayed] = useState(false)

  const messagesRef = useRef(messages)
  const personaStateRef = useRef(personaState)
  const micButtonRef = useRef<HTMLButtonElement>(null)
  const holdingRef = useRef(false)

  const voicePlayer = useSimVoicePlayer()
  const voiceCapture = useSimVoiceCapture()

  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  useEffect(() => {
    personaStateRef.current = personaState
  }, [personaState])

  useEffect(() => () => {
    voiceCapture.dispose()
    voicePlayer.dispose()
  }, [voiceCapture, voicePlayer])

  const playOpeningLine = useCallback(async () => {
    const line = persona?.opening_line?.trim()
    if (!line || openingPlayed) return

    try {
      const res = await fetch('/api/sudarsim/preview-tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: line,
          locale,
          ...(voiceId ? { voice: voiceId } : {}),
        }),
      })
      const data = (await res.json()) as {
        success?: boolean
        audio_base64?: string | null
        audio_mime?: string | null
        error?: string
      }
      if (!data.success || !data.audio_base64) {
        setTtsWarning('Voice unavailable for opening line — text only.')
        return
      }
      setVoiceStage('speaking')
      const ok = await voicePlayer.speak(data.audio_base64, data.audio_mime)
      if (!ok && voicePlayer.lastError) setTtsWarning(voicePlayer.lastError)
      setOpeningPlayed(true)
    } catch {
      setTtsWarning('Could not play opening line audio.')
    } finally {
      setVoiceStage('idle')
    }
  }, [locale, openingPlayed, persona?.opening_line, voiceId, voicePlayer])

  const enableMicrophone = async () => {
    setVoiceError(null)
    setTtsWarning(null)
    try {
      await voiceCapture.enableMicrophone()
      await voicePlayer.unlock()
      setShowMicEnable(false)
      if (persona?.opening_line && !openingPlayed) {
        void playOpeningLine()
      }
    } catch (err) {
      setVoiceError(err instanceof Error ? err.message : 'Could not enable microphone.')
    }
  }

  const sendTurn = useCallback(
    async (
      payload: { text?: string; audio_base64?: string; audio_mime?: string },
      channel: Channel,
    ) => {
      const hasText = Boolean(payload.text?.trim())
      const hasAudio = Boolean(payload.audio_base64?.trim())
      if (!hasText && !hasAudio) return

      setVoiceError(null)
      setTtsWarning(null)
      setVoiceStage(hasAudio ? 'transcribing' : 'thinking')

      if (hasText && payload.text) {
        setMessages((m) => [...m, { role: 'learner', text: payload.text!, channel }])
      }

      const history = messagesRef.current.map((m) => ({ role: m.role, text: m.text }))

      try {
        const body = buildPreviewTurnPayload({
          scenario,
          persona_state: personaStateRef.current,
          channel,
          history,
          text: payload.text,
          audio_base64: payload.audio_base64,
          audio_mime: payload.audio_mime,
        })

        setVoiceStage('thinking')

        const res = await fetch('/api/sudarsim/preview-turn', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })

        let data: {
          success?: boolean
          reply?: string
          persona_state?: SimPersonaState
          learner_text?: string
          audio_base64?: string | null
          audio_mime?: string | null
          error?: string
          detail?: string
        }

        try {
          data = (await res.json()) as typeof data
        } catch {
          setVoiceError(`Server error (${res.status}). Is Intelligence running?`)
          setVoiceStage('idle')
          return
        }

        if (!data.success) {
          setVoiceError(parseApiError(data))
          setVoiceStage('idle')
          return
        }

        if (data.learner_text) {
          setMessages((m) => {
            const last = m[m.length - 1]
            if (last?.role === 'learner' && last.text === data.learner_text) return m
            return [...m, { role: 'learner', text: data.learner_text!, channel }]
          })
        }
        if (data.reply) {
          setMessages((m) => [...m, { role: 'customer', text: data.reply!, channel }])
        }
        if (data.persona_state) setPersonaState(data.persona_state)

        if (data.audio_base64) {
          setVoiceStage('speaking')
          void voicePlayer.speak(data.audio_base64, data.audio_mime).then((ok) => {
            if (!ok && voicePlayer.lastError) setTtsWarning(voicePlayer.lastError)
            setVoiceStage('idle')
          })
        } else {
          setTtsWarning('Voice unavailable — text only.')
          setVoiceStage('idle')
        }
      } catch {
        setVoiceError('Could not reach preview API. Check Studio env: SUDAR_INTELLIGENCE_URL + INTELLIGENCE_SERVICE_SECRET.')
        setVoiceStage('idle')
      }
    },
    [scenario, voicePlayer],
  )

  const handlePointerDown = async (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (activeChannel !== 'phone' || voiceStage === 'thinking' || voiceStage === 'speaking') return
    e.preventDefault()
    holdingRef.current = true
    micButtonRef.current?.setPointerCapture(e.pointerId)
    setVoiceError(null)
    voiceCapture.clearCaptureError()
    try {
      await voiceCapture.startRecording()
      setVoiceStage('recording')
    } catch (err) {
      holdingRef.current = false
      setVoiceError(err instanceof Error ? err.message : 'Could not start recording.')
      setVoiceStage('idle')
    }
  }

  const handlePointerUp = async (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (!holdingRef.current) return
    holdingRef.current = false
    if (micButtonRef.current?.hasPointerCapture(e.pointerId)) {
      micButtonRef.current.releasePointerCapture(e.pointerId)
    }
    if (voiceStage !== 'recording') return

    try {
      const captured = await voiceCapture.stopRecording()
      if (captured.text) {
        await sendTurn({ text: captured.text }, 'phone')
      } else if (captured.audio_base64) {
        await sendTurn(
          { audio_base64: captured.audio_base64, audio_mime: captured.audio_mime },
          'phone',
        )
      }
    } catch (err) {
      setVoiceError(err instanceof Error ? err.message : 'Recording failed.')
      setVoiceStage('idle')
    }
  }

  const micBusy = voiceStage !== 'idle' && voiceStage !== 'recording'
  const inputDisabled = voiceStage === 'recording' || voiceStage === 'transcribing' || voiceStage === 'thinking'
  const title = typeof scenario.title === 'string' ? scenario.title : 'Preview'
  const pulseScale = 1 + voiceCapture.micLevel * 0.35

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="studio-sim-preview-title"
    >
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-700 px-4 py-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-violet-400">Studio preview</p>
            <h2 id="studio-sim-preview-title" className="text-lg font-semibold text-white">
              {title}
            </h2>
            <p className="text-xs text-slate-400">No database session — test conversation here before publishing.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
            aria-label="Close preview"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden p-4 lg:flex-row">
          <div className="flex min-h-[320px] flex-1 flex-col rounded-xl border border-slate-700 bg-slate-950/50">
            <div className="flex border-b border-slate-700">
              {channels.map((ch) => (
                <button
                  key={ch}
                  type="button"
                  onClick={() => setActiveChannel(ch)}
                  className={`flex-1 px-4 py-2 text-sm font-medium capitalize ${
                    activeChannel === ch ? 'border-b-2 border-violet-500 text-violet-300' : 'text-slate-400'
                  }`}
                >
                  {ch}
                </button>
              ))}
            </div>

            <div className="flex flex-1 flex-col p-4">
              <div className="mb-2 flex justify-between text-xs text-slate-400">
                <span>Customer: {persona?.name ?? 'Customer'}</span>
                <span>
                  Mood {Math.round(personaState.mood * 100)}% · Trust {Math.round(personaState.trust * 100)}%
                </span>
              </div>

              <div className="flex-1 space-y-2 overflow-y-auto rounded-lg bg-slate-900/80 p-3" role="log" aria-live="polite">
                {messages
                  .filter((m) => m.channel === activeChannel || activeChannel === 'phone')
                  .map((m, i) => (
                    <div
                      key={i}
                      className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                        m.role === 'learner'
                          ? 'ml-auto bg-violet-600 text-white'
                          : 'border border-slate-600 bg-slate-800 text-slate-100'
                      }`}
                    >
                      {m.text}
                    </div>
                  ))}

                {voiceStage === 'recording' && voiceCapture.interimTranscript ? (
                  <div className="ml-auto max-w-[85%] rounded-lg border border-violet-400/40 bg-violet-600/40 px-3 py-2 text-sm italic text-violet-100">
                    You: {voiceCapture.interimTranscript}
                  </div>
                ) : null}
              </div>

              {activeChannel === 'phone' ? (
                <div className="mt-3 flex flex-col items-center gap-2">
                  {showMicEnable ? (
                    <button
                      type="button"
                      onClick={() => void enableMicrophone()}
                      className="rounded-lg border border-violet-500/60 bg-violet-950/60 px-4 py-2 text-sm text-violet-100 hover:bg-violet-900/60"
                    >
                      Enable microphone
                    </button>
                  ) : (
                    <button
                      ref={micButtonRef}
                      type="button"
                      disabled={micBusy}
                      onPointerDown={(e) => void handlePointerDown(e)}
                      onPointerUp={(e) => void handlePointerUp(e)}
                      onPointerCancel={(e) => void handlePointerUp(e)}
                      aria-label="Hold to talk"
                      aria-pressed={voiceStage === 'recording'}
                      style={{
                        transform: voiceStage === 'recording' ? `scale(${pulseScale})` : undefined,
                      }}
                      className={`flex h-14 w-14 touch-none items-center justify-center rounded-full border-2 transition-colors disabled:opacity-50 ${
                        voiceStage === 'recording'
                          ? 'border-red-500 bg-red-600 text-white'
                          : 'border-violet-500 bg-violet-950 text-violet-200 hover:bg-violet-900'
                      }`}
                    >
                      {voiceStage === 'recording' ? (
                        <Mic className="h-6 w-6 animate-pulse" aria-hidden />
                      ) : voiceStage === 'transcribing' || voiceStage === 'thinking' ? (
                        <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
                      ) : (
                        <Mic className="h-6 w-6" aria-hidden />
                      )}
                    </button>
                  )}

                  <p className="text-center text-xs text-slate-400">
                    {showMicEnable
                      ? 'Browser will ask for mic access — required once per session'
                      : stageLabel(voiceStage)}
                  </p>
                </div>
              ) : null}

              {voiceError || voiceCapture.captureError ? (
                <p className="mt-2 text-center text-xs text-red-400" role="alert">
                  {voiceError ?? voiceCapture.captureError}
                </p>
              ) : null}

              {ttsWarning ? (
                <p className="mt-1 text-center text-xs text-amber-400" role="status">
                  {ttsWarning}
                </p>
              ) : null}

              <form
                className="mt-3 flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault()
                  const text = input.trim()
                  if (!text || inputDisabled || voiceStage === 'speaking') return
                  setInput('')
                  void sendTurn({ text }, activeChannel)
                }}
              >
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={inputDisabled || voiceStage === 'speaking'}
                  className="flex-1 rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white disabled:opacity-50"
                  placeholder="Type a reply (or hold mic on Phone)…"
                  aria-label="Message input"
                />
                <button
                  type="submit"
                  disabled={inputDisabled || voiceStage === 'speaking' || !input.trim()}
                  className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  Send
                </button>
              </form>
            </div>
          </div>

          {crmSkin?.image_url ? (
            <div className="hidden w-full shrink-0 lg:block lg:w-72">
              <p className="mb-2 text-xs text-slate-400">CRM (preview only)</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={crmSkin.image_url} alt="CRM screenshot" className="rounded-lg border border-slate-700" />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
