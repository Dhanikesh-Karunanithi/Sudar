'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { CrmOverlayCanvas } from './CrmOverlayCanvas'
import { SimCoachReport } from './SimCoachReport'
import type { SimCrmSkin, SimPersonaState } from '@shared-sudarsim/schemas'

type Channel = 'phone' | 'chat' | 'email'

type ScenarioPayload = {
  id: string
  title: string
  locale: string
  persona: { name?: string; opening_line?: string }
  channels: { phone?: boolean; chat?: boolean; email?: boolean }
  crm_skin: SimCrmSkin | null
  completion_rule?: { enabled?: boolean }
}

const SUDAR_SIM_WS = (process.env.NEXT_PUBLIC_SUDAR_SIM_WS_URL ?? 'ws://localhost:8090').replace(/\/$/, '')

export function SimWorkspace({
  sessionId,
  scenario,
  initialPersonaState,
  moduleId,
  courseId,
  onCompleteModule,
}: {
  sessionId: string
  scenario: ScenarioPayload
  initialPersonaState: SimPersonaState
  moduleId?: string
  courseId?: string
  onCompleteModule?: () => void
}) {
  const channels: Channel[] = (['phone', 'chat', 'email'] as Channel[]).filter(
    (c) => scenario.channels?.[c] !== false,
  )
  const [activeChannel, setActiveChannel] = useState<Channel>(channels[0] ?? 'phone')
  const [personaState, setPersonaState] = useState(initialPersonaState)
  const [messages, setMessages] = useState<{ role: string; text: string; channel: Channel }[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [phase, setPhase] = useState<'sim' | 'coach'>('sim')
  const [coachResult, setCoachResult] = useState<Record<string, unknown> | null>(null)
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_type: 'sim_start',
        course_id: courseId,
        module_id: moduleId,
        modality: 'sudarsim',
        payload: { session_id: sessionId, scenario_id: scenario.id },
      }),
    }).catch(() => {})
  }, [sessionId, scenario.id, courseId, moduleId])

  useEffect(() => {
    if (scenario.persona?.opening_line) {
      setMessages([{ role: 'customer', text: scenario.persona.opening_line, channel: 'phone' }])
    }
  }, [scenario.persona?.opening_line])

  useEffect(() => {
    if (activeChannel !== 'phone') return
    const ws = new WebSocket(`${SUDAR_SIM_WS}/ws/session/${sessionId}`)
    wsRef.current = ws
    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          type: 'config',
          locale: scenario.locale,
          scenario_id: scenario.id,
          persona_state: personaState,
        }),
      )
    }
    ws.onmessage = (ev) => {
      const data = JSON.parse(ev.data as string) as {
        type: string
        reply?: string
        persona_state?: SimPersonaState
      }
      if (data.type === 'customer_turn' && data.reply) {
        setMessages((m) => [...m, { role: 'customer', text: data.reply!, channel: 'phone' }])
        if (data.persona_state) setPersonaState(data.persona_state)
        setLoading(false)
      }
    }
    return () => ws.close()
  }, [sessionId, scenario.id, scenario.locale, activeChannel])

  const sendTurn = useCallback(
    async (text: string, channel: Channel) => {
      if (!text.trim()) return
      setLoading(true)
      setMessages((m) => [...m, { role: 'learner', text, channel }])

      if (channel === 'phone' && wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'user_turn', text }))
        return
      }

      const res = await fetch(`/api/sim/session/${sessionId}?action=turn`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel, text }),
      })
      const data = await res.json()
      if (data.success) {
        setMessages((m) => [...m, { role: 'customer', text: data.reply, channel }])
        setPersonaState(data.persona_state)
      }
      setLoading(false)
    },
    [sessionId],
  )

  const handleCrmAction = async (overlayId: string, action: string, value?: string) => {
    await fetch(`/api/sim/session/${sessionId}?action=crm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ overlay_id: overlayId, action, value }),
    })
  }

  const endSession = async () => {
    setLoading(true)
    const res = await fetch(`/api/sim/session/${sessionId}?action=complete`, { method: 'POST' })
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

  if (phase === 'coach' && coachResult) {
    return (
      <SimCoachReport
        result={coachResult as never}
        onRetry={() => window.location.reload()}
        onContinue={onCompleteModule}
      />
    )
  }

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

          <div className="flex-1 space-y-2 overflow-y-auto rounded-lg bg-muted/30 p-3">
            {messages
              .filter((m) => m.channel === activeChannel || activeChannel === 'phone')
              .map((m, i) => (
                <div
                  key={i}
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                    m.role === 'learner' ? 'ml-auto bg-primary text-primary-foreground' : 'bg-background border border-border'
                  }`}
                >
                  {m.text}
                </div>
              ))}
          </div>

          <form
            className="mt-3 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              sendTurn(input, activeChannel)
              setInput('')
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
              placeholder={activeChannel === 'email' ? 'Compose reply…' : 'Type or speak (phone uses voice WS)…'}
              aria-label="Message input"
            />
            <button
              type="submit"
              disabled={loading}
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
