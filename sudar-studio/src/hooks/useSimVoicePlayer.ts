'use client'

import { useCallback, useRef, useState } from 'react'

function base64ToBlob(base64: string, mime: string): Blob {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i)
  }
  return new Blob([bytes], { type: mime })
}

export function useSimVoicePlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const objectUrlRef = useRef<string | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const unlockedRef = useRef(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [lastError, setLastError] = useState<string | null>(null)

  const revokeObjectUrl = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
      objectUrlRef.current = null
    }
  }, [])

  const unlock = useCallback(async () => {
    if (unlockedRef.current) return
    try {
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (Ctx) {
        const ctx = audioContextRef.current ?? new Ctx()
        audioContextRef.current = ctx
        if (ctx.state === 'suspended') await ctx.resume()
        const buffer = ctx.createBuffer(1, 1, 22050)
        const source = ctx.createBufferSource()
        source.buffer = buffer
        source.connect(ctx.destination)
        source.start(0)
      }
      if (!audioRef.current) {
        audioRef.current = new Audio()
      }
      audioRef.current.muted = true
      await audioRef.current.play().catch(() => undefined)
      audioRef.current.pause()
      audioRef.current.muted = false
      audioRef.current.currentTime = 0
      unlockedRef.current = true
    } catch {
      /* gesture unlock best-effort */
    }
  }, [])

  const stop = useCallback(() => {
    const audio = audioRef.current
    if (audio) {
      audio.pause()
      audio.currentTime = 0
    }
    setIsSpeaking(false)
  }, [])

  const speak = useCallback(
    async (audioBase64: string, audioMime?: string | null): Promise<boolean> => {
      setLastError(null)
      if (!audioBase64.trim()) {
        setLastError('Voice unavailable — text only')
        return false
      }

      await unlock()

      revokeObjectUrl()
      const mime = audioMime?.trim() || 'audio/mpeg'
      const blob = base64ToBlob(audioBase64, mime)
      const url = URL.createObjectURL(blob)
      objectUrlRef.current = url

      if (!audioRef.current) {
        audioRef.current = new Audio()
      }

      const audio = audioRef.current
      audio.src = url

      return new Promise((resolve) => {
        const finish = (ok: boolean, err?: string) => {
          setIsSpeaking(false)
          if (err) setLastError(err)
          resolve(ok)
        }

        audio.onended = () => finish(true)
        audio.onerror = () => finish(false, 'Could not play customer voice. Check browser audio output.')

        setIsSpeaking(true)
        void audio.play().catch(() => finish(false, 'Browser blocked audio playback. Click Enable microphone again.'))
      })
    },
    [revokeObjectUrl, unlock],
  )

  const dispose = useCallback(() => {
    stop()
    revokeObjectUrl()
    void audioContextRef.current?.close()
    audioContextRef.current = null
    audioRef.current = null
    unlockedRef.current = false
  }, [revokeObjectUrl, stop])

  return {
    unlock,
    speak,
    stop,
    dispose,
    isSpeaking,
    lastError,
    clearError: () => setLastError(null),
  }
}
