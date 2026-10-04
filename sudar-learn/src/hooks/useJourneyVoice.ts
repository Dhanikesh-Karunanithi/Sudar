'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

export type JourneyVoicePhase = 'idle' | 'recording' | 'transcribing' | 'speaking'

const PREFERRED_MIME = 'audio/webm;codecs=opus'
const MAX_RECORDING_MS = 60_000

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const result = String(reader.result ?? '')
      resolve(result.includes(',') ? result.split(',')[1] ?? '' : result)
    }
    reader.onerror = () => reject(reader.error ?? new Error('read failed'))
    reader.readAsDataURL(blob)
  })
}

async function postVoice<T>(body: Record<string, unknown>): Promise<T> {
  const res = await fetch('/api/journey/voice', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = (await res.json().catch(() => null)) as { success?: boolean; data?: T; error?: string } | null
  if (!res.ok || !data?.success || !data.data) {
    throw new Error(data?.error ?? 'Voice is unavailable right now. You can keep typing.')
  }
  return data.data
}

/** SudarNotes voice: record → Intelligence STT → text; Sudar reply → Intelligence TTS → playback. */
export function useJourneyVoice() {
  const [phase, setPhase] = useState<JourneyVoicePhase>('idle')
  const [error, setError] = useState<string | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const stopTimerRef = useRef<number | null>(null)
  const resolveStopRef = useRef<((text: string | null) => void) | null>(null)

  const releaseMic = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    if (stopTimerRef.current) window.clearTimeout(stopTimerRef.current)
    stopTimerRef.current = null
  }, [])

  const stopSpeaking = useCallback(() => {
    audioRef.current?.pause()
    audioRef.current = null
    setPhase((p) => (p === 'speaking' ? 'idle' : p))
  }, [])

  useEffect(
    () => () => {
      releaseMic()
      audioRef.current?.pause()
    },
    [releaseMic],
  )

  const startRecording = useCallback(async (): Promise<boolean> => {
    setError(null)
    stopSpeaking()
    if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setError("Voice isn't supported in this browser. You can keep typing.")
      return false
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const mimeType = MediaRecorder.isTypeSupported(PREFERRED_MIME) ? PREFERRED_MIME : undefined
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      chunksRef.current = []
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      recorder.onstop = async () => {
        releaseMic()
        const resolve = resolveStopRef.current
        resolveStopRef.current = null
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' })
        if (blob.size === 0) {
          setPhase('idle')
          resolve?.(null)
          return
        }
        setPhase('transcribing')
        try {
          const audio_base64 = await blobToBase64(blob)
          const { text } = await postVoice<{ text: string }>({
            action: 'stt',
            audio_base64,
            audio_mime: blob.type,
          })
          setPhase('idle')
          resolve?.(text)
        } catch (e) {
          setError(e instanceof Error ? e.message : 'Voice is unavailable right now.')
          setPhase('idle')
          resolve?.(null)
        }
      }
      recorderRef.current = recorder
      recorder.start()
      setPhase('recording')
      stopTimerRef.current = window.setTimeout(() => {
        if (recorder.state === 'recording') recorder.stop()
      }, MAX_RECORDING_MS)
      return true
    } catch {
      releaseMic()
      setError('Microphone access was blocked. Allow it in your browser settings, or keep typing.')
      setPhase('idle')
      return false
    }
  }, [releaseMic, stopSpeaking])

  /** Resolves with the transcript (null when nothing was heard or STT failed). */
  const stopRecording = useCallback((): Promise<string | null> => {
    const recorder = recorderRef.current
    if (!recorder || recorder.state !== 'recording') return Promise.resolve(null)
    return new Promise((resolve) => {
      resolveStopRef.current = resolve
      recorder.stop()
    })
  }, [])

  const speak = useCallback(async (text: string) => {
    setError(null)
    try {
      const { audio_base64, audio_mime } = await postVoice<{ audio_base64: string | null; audio_mime: string | null }>({
        action: 'tts',
        text,
      })
      if (!audio_base64) return
      audioRef.current?.pause()
      const audio = new Audio(`data:${audio_mime ?? 'audio/mpeg'};base64,${audio_base64}`)
      audioRef.current = audio
      setPhase('speaking')
      audio.onended = () => {
        if (audioRef.current === audio) audioRef.current = null
        setPhase('idle')
      }
      await audio.play().catch(() => setPhase('idle'))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Voice is unavailable right now.')
      setPhase('idle')
    }
  }, [])

  return { phase, error, clearError: () => setError(null), startRecording, stopRecording, speak, stopSpeaking }
}
