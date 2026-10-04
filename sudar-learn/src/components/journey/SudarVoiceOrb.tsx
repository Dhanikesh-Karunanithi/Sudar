'use client'

import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import styles from './SudarVoiceOrb.module.css'

export type VoiceOrbMode = 'idle' | 'listening' | 'speaking' | 'thinking'

interface SudarVoiceOrbProps {
  mode?: VoiceOrbMode
  /** When true, mic analyser drives breathing amplitude. */
  reactive?: boolean
  className?: string
  label?: string
}

export function SudarVoiceOrb({
  mode = 'idle',
  reactive = false,
  className,
  label = 'Sudar voice presence',
}: SudarVoiceOrbProps) {
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!reactive) {
      const el = rootRef.current
      if (el) {
        el.style.setProperty('--min-scale', '1')
        el.style.setProperty('--max-scale', '1.08')
      }
      return
    }

    if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      return
    }

    let cancelled = false
    let stream: MediaStream | null = null
    let audioContext: AudioContext | null = null
    let raf = 0

    void (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        audioContext = new AudioContext()
        const source = audioContext.createMediaStreamSource(stream)
        const analyser = audioContext.createAnalyser()
        analyser.fftSize = 256
        source.connect(analyser)
        const data = new Uint8Array(analyser.frequencyBinCount)

        const tick = () => {
          raf = requestAnimationFrame(tick)
          analyser.getByteFrequencyData(data)
          const average = data.reduce((sum, v) => sum + v, 0) / data.length
          const level = Math.min(Math.max(average / 128, 0.1), 2)
          const el = rootRef.current
          if (!el) return
          el.style.setProperty('--min-scale', (1 - level * 0.05).toFixed(2))
          el.style.setProperty('--max-scale', (1 + level * 0.1).toFixed(2))
        }
        tick()
      } catch {
        // Permission denied — CSS breathing only
      }
    })()

    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
      stream?.getTracks().forEach((t) => t.stop())
      void audioContext?.close()
    }
  }, [reactive])

  return (
    <div
      ref={rootRef}
      className={cn(
        styles.root,
        styles.rootBreathing,
        mode === 'listening' && styles.rootListening,
        mode === 'speaking' && styles.rootSpeaking,
        mode === 'thinking' && styles.rootThinking,
        className,
      )}
      role="img"
      aria-label={label}
    >
      <div className={styles.container}>
        <div className={cn(styles.blob, styles.blobCore)} />
        <div className={cn(styles.blob, styles.blobCyan)} />
        <div className={cn(styles.blob, styles.blobPrimary)} />
        <div className={cn(styles.blob, styles.blobAccent)} />
        <div className={styles.rings}>
          <div className={cn(styles.rings, styles.ringsInner)} />
        </div>
      </div>
      <div className={styles.glass} aria-hidden />
    </div>
  )
}
