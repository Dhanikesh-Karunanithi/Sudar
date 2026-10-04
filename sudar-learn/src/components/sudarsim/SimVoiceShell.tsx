'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useConnectionState,
  useLocalParticipant,
  useRoomContext,
} from '@livekit/components-react'
import { ConnectionState, RoomEvent, type RemoteParticipant } from 'livekit-client'
import { Loader2, Mic, MicOff, PhoneOff } from 'lucide-react'

/** The agent is dispatched in the background; if it crashes the room stays silent, so we time out. */
const AGENT_JOIN_TIMEOUT_MS = 15000
const AGENT_IDENTITY_PREFIX = 'sim-agent'

export const SIM_VOICE_FALLBACK_COPY = {
  agentMissing: "The voice customer couldn't join the call.",
  agentLeft: 'The voice customer dropped off the call.',
  tokenFailed: 'Voice is unavailable right now.',
  connectFailed: "We couldn't connect to the voice service.",
} as const

export type VoiceConfig = {
  room_name: string
  livekit_url: string | null
  token: string | null
}

type VoiceUiState = 'connecting' | 'listening' | 'customer_speaking' | 'processing' | 'error' | 'disconnected'

type ChatMessage = { role: string; text: string }

function voiceStatusLabel(state: VoiceUiState, partial: string): string {
  switch (state) {
    case 'connecting':
      return 'Connecting voice…'
    case 'customer_speaking':
      return 'Customer speaking…'
    case 'processing':
      return 'Customer thinking…'
    case 'listening':
      return partial ? `You: ${partial}` : 'Listening — speak naturally'
    case 'error':
      return 'Voice connection issue'
    default:
      return 'Call ended'
  }
}

function VoiceRoomInner({
  customerName,
  onTranscriptUpdate,
  onEndCall,
  onAgentUnavailable,
}: {
  customerName: string
  onTranscriptUpdate: (messages: ChatMessage[]) => void
  onEndCall: () => void
  onAgentUnavailable: (reason: string) => void
}) {
  const room = useRoomContext()
  const connectionState = useConnectionState()
  const { localParticipant } = useLocalParticipant()
  const [voiceState, setVoiceState] = useState<VoiceUiState>('connecting')
  const [partialTranscript, setPartialTranscript] = useState('')
  const [micEnabled, setMicEnabled] = useState(true)
  const messagesRef = useRef<ChatMessage[]>([])
  const agentJoinedRef = useRef(false)

  useEffect(() => {
    if (connectionState !== ConnectionState.Connected) return
    const isAgent = (p: RemoteParticipant) => p.identity.startsWith(AGENT_IDENTITY_PREFIX)
    if ([...room.remoteParticipants.values()].some(isAgent)) agentJoinedRef.current = true

    const onJoined = (p: RemoteParticipant) => {
      if (isAgent(p)) agentJoinedRef.current = true
    }
    const onLeft = (p: RemoteParticipant) => {
      if (!isAgent(p)) return
      void room.disconnect()
      onAgentUnavailable(SIM_VOICE_FALLBACK_COPY.agentLeft)
    }
    room.on(RoomEvent.ParticipantConnected, onJoined)
    room.on(RoomEvent.ParticipantDisconnected, onLeft)
    const timer = window.setTimeout(() => {
      if (agentJoinedRef.current) return
      void room.disconnect()
      onAgentUnavailable(SIM_VOICE_FALLBACK_COPY.agentMissing)
    }, AGENT_JOIN_TIMEOUT_MS)
    return () => {
      window.clearTimeout(timer)
      room.off(RoomEvent.ParticipantConnected, onJoined)
      room.off(RoomEvent.ParticipantDisconnected, onLeft)
    }
  }, [connectionState, room, onAgentUnavailable])

  const pushMessage = useCallback(
    (role: string, text: string) => {
      if (!text.trim()) return
      const last = messagesRef.current[messagesRef.current.length - 1]
      if (last?.role === role && last.text === text) return
      messagesRef.current = [...messagesRef.current, { role, text }]
      onTranscriptUpdate([...messagesRef.current])
    },
    [onTranscriptUpdate],
  )

  useEffect(() => {
    const onData = (payload: Uint8Array) => {
      try {
        const data = JSON.parse(new TextDecoder().decode(payload)) as {
          type?: string
          text?: string
          partial?: boolean
          role?: string
        }
        if (data.type !== 'transcript' || !data.text) return
        if (data.partial) {
          setPartialTranscript(data.text)
          setVoiceState('listening')
        } else {
          setPartialTranscript('')
          const role = data.role === 'learner' ? 'learner' : 'customer'
          pushMessage(role, data.text)
          setVoiceState(role === 'customer' ? 'customer_speaking' : 'listening')
        }
      } catch {
        /* ignore */
      }
    }
    room.on(RoomEvent.DataReceived, onData)
    return () => {
      room.off(RoomEvent.DataReceived, onData)
    }
  }, [room])

  useEffect(() => {
    if (connectionState === ConnectionState.Connected) {
      setVoiceState('listening')
      void localParticipant.setMicrophoneEnabled(true)
    } else if (connectionState === ConnectionState.Disconnected) {
      setVoiceState('disconnected')
    } else if (connectionState === ConnectionState.Connecting) {
      setVoiceState('connecting')
    }
  }, [connectionState, localParticipant])

  useEffect(() => {
    const onSpeaking = () => setVoiceState('customer_speaking')
    const onSilent = () => setVoiceState('listening')
    room.on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
      const agentSpeaking = speakers.some((p) => p.identity.startsWith('sim-agent'))
      if (agentSpeaking) onSpeaking()
      else if (voiceState === 'customer_speaking') onSilent()
    })
    return () => {
      room.removeAllListeners(RoomEvent.ActiveSpeakersChanged)
    }
  }, [room, voiceState])

  const toggleMic = async () => {
    const next = !micEnabled
    await localParticipant.setMicrophoneEnabled(next)
    setMicEnabled(next)
  }

  const handleEnd = () => {
    void room.disconnect()
    onEndCall()
  }

  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-muted/20 p-4">
      <div className="flex w-full items-center justify-between text-xs text-muted-foreground">
        <span>Live call · {customerName}</span>
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary">Voice</span>
      </div>

      {partialTranscript ? (
        <p className="w-full rounded-md bg-background/80 px-3 py-2 text-sm italic text-muted-foreground">
          {partialTranscript}
        </p>
      ) : null}

      <p className="text-center text-sm text-foreground" aria-live="polite">
        {voiceState === 'connecting' ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            {voiceStatusLabel(voiceState, partialTranscript)}
          </span>
        ) : (
          voiceStatusLabel(voiceState, partialTranscript)
        )}
      </p>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => void toggleMic()}
          aria-label={micEnabled ? 'Mute microphone' : 'Unmute microphone'}
          className={`flex h-12 w-12 items-center justify-center rounded-full border-2 ${
            micEnabled ? 'border-primary text-primary' : 'border-muted-foreground text-muted-foreground'
          }`}
        >
          {micEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
        </button>
        <button
          type="button"
          onClick={handleEnd}
          aria-label="End voice call"
          className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-destructive text-destructive"
        >
          <PhoneOff className="h-5 w-5" />
        </button>
      </div>

      <RoomAudioRenderer />
    </div>
  )
}

export function SimVoiceShell({
  sessionId,
  voice,
  customerName,
  onTranscriptUpdate,
  onFallback,
  onDisconnected,
}: {
  sessionId: string
  voice: VoiceConfig | null
  customerName: string
  onTranscriptUpdate: (messages: ChatMessage[]) => void
  onFallback: (reason: string) => void
  onDisconnected?: () => void
}) {
  const [config, setConfig] = useState<VoiceConfig | null>(voice)
  const onFallbackRef = useRef(onFallback)
  useEffect(() => {
    onFallbackRef.current = onFallback
  }, [onFallback])
  const fallback = useCallback((reason: string) => onFallbackRef.current(reason), [])

  useEffect(() => {
    if (voice?.token && voice.livekit_url) {
      setConfig(voice)
      return
    }
    void (async () => {
      try {
        const res = await fetch(`/api/sim/session/${sessionId}/voice`, { method: 'POST' })
        const data = (await res.json()) as { success?: boolean; voice?: VoiceConfig; error?: string }
        if (data.success && data.voice?.token && data.voice.livekit_url) {
          setConfig(data.voice)
        } else {
          fallback(SIM_VOICE_FALLBACK_COPY.tokenFailed)
        }
      } catch {
        fallback(SIM_VOICE_FALLBACK_COPY.connectFailed)
      }
    })()
  }, [sessionId, voice, fallback])

  if (!config?.livekit_url || !config.token) {
    return (
      <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Preparing voice connection…
      </div>
    )
  }

  return (
    <LiveKitRoom
      serverUrl={config.livekit_url}
      token={config.token}
      connect
      audio
      video={false}
      onDisconnected={() => onDisconnected?.()}
      onError={() => fallback(SIM_VOICE_FALLBACK_COPY.connectFailed)}
      className="w-full"
    >
      <VoiceRoomInner
        customerName={customerName}
        onTranscriptUpdate={onTranscriptUpdate}
        onEndCall={() => onDisconnected?.()}
        onAgentUnavailable={fallback}
      />
    </LiveKitRoom>
  )
}
