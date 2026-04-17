'use client'

import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { Pause, Volume2 } from 'lucide-react'
import type { TtsVoiceOption, VoiceLibraryProviderStatus } from '@/lib/audio/voices'
import { cn } from '@/lib/utils'

interface VoiceCharacterStageProps {
  voices: TtsVoiceOption[]
  value: string | null
  onChange: (voiceId: string) => void
  providerStatuses?: VoiceLibraryProviderStatus[]
}

const paletteClasses: Record<NonNullable<TtsVoiceOption['paletteKey']>, string> = {
  violet: 'from-violet-500/20 to-violet-500/5 border-violet-400/30',
  cyan: 'from-cyan-500/20 to-cyan-500/5 border-cyan-400/30',
  amber: 'from-amber-500/20 to-amber-500/5 border-amber-400/30',
  rose: 'from-rose-500/20 to-rose-500/5 border-rose-400/30',
  emerald: 'from-emerald-500/20 to-emerald-500/5 border-emerald-400/30',
}

export function VoiceCharacterStage({ voices, value, onChange, providerStatuses = [] }: VoiceCharacterStageProps) {
  const [activeVoiceId, setActiveVoiceId] = useState<string>(value ?? voices[0]?.id ?? '')
  const [isPlaying, setIsPlaying] = useState(false)
  const [reduceMotion, setReduceMotion] = useState(false)
  const audioRefs = useRef<Record<string, HTMLAudioElement | null>>({})
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({})

  useEffect(() => {
    if (!value && voices[0]?.id) {
      onChange(voices[0].id)
    }
  }, [onChange, value, voices])

  useEffect(() => {
    if (value) {
      setActiveVoiceId(value)
    }
  }, [value])

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const syncMotionPreference = () => setReduceMotion(mediaQuery.matches)
    syncMotionPreference()
    mediaQuery.addEventListener('change', syncMotionPreference)
    return () => mediaQuery.removeEventListener('change', syncMotionPreference)
  }, [])

  const activeVoice = useMemo(
    () => voices.find((voice) => voice.id === activeVoiceId) ?? voices[0],
    [activeVoiceId, voices]
  )

  const pauseAll = (exceptVoiceId?: string) => {
    Object.entries(audioRefs.current).forEach(([voiceId, audio]) => {
      if (!audio || (exceptVoiceId && voiceId === exceptVoiceId)) return
      audio.pause()
      audio.currentTime = 0
    })
  }

  const playVoice = async (voiceId: string) => {
    const audio = audioRefs.current[voiceId]
    if (!audio) return
    pauseAll(voiceId)
    audio.currentTime = 0
    setIsPlaying(false)
    try {
      await audio.play()
      setIsPlaying(true)
    } catch {
      setIsPlaying(false)
    }
  }

  const handleCharacterSelect = (voiceId: string) => {
    setActiveVoiceId(voiceId)
    onChange(voiceId)
    void playVoice(voiceId)
  }

  const getNeighborIndex = (currentIndex: number, key: string) => {
    if (key === 'ArrowRight' || key === 'ArrowDown') {
      return (currentIndex + 1) % voices.length
    }
    if (key === 'ArrowLeft' || key === 'ArrowUp') {
      return (currentIndex - 1 + voices.length) % voices.length
    }
    return currentIndex
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-card-foreground">Voice cast</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Click a character name to hear it instantly and explore its personality.
        </p>
      </div>

      {providerStatuses.length > 0 ? (
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-semibold text-card-foreground">Connected provider libraries</p>
          <p className="text-[11px] text-muted-foreground mt-1">
            Provider voice libraries appear here when fully enabled. Built-in Edge-TTS voices above are always available.
          </p>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {providerStatuses.map((provider) => (
              <div key={provider.id} className="rounded-lg border border-border/80 bg-muted/20 px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium text-card-foreground">{provider.name}</p>
                  <span
                    className={cn(
                      'text-[10px] px-2 py-0.5 rounded-full border',
                      provider.status === 'configured'
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600'
                        : 'border-border bg-background text-muted-foreground'
                    )}
                  >
                    {provider.status === 'configured' ? 'Connected' : 'Not configured'}
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">{provider.description}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {voices.map((voice, index) => {
            const isSelected = voice.id === activeVoiceId
            return (
              <button
                key={voice.id}
                ref={(node) => {
                  buttonRefs.current[voice.id] = node
                }}
                type="button"
                onClick={() => handleCharacterSelect(voice.id)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    handleCharacterSelect(voice.id)
                    return
                  }
                  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
                    event.preventDefault()
                    const nextIndex = getNeighborIndex(index, event.key)
                    const nextVoice = voices[nextIndex]
                    if (nextVoice) {
                      buttonRefs.current[nextVoice.id]?.focus()
                    }
                  }
                }}
                className={cn(
                  'relative rounded-xl border px-4 py-3 text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/70',
                  'bg-card hover:bg-muted/50',
                  isSelected ? 'border-primary/50 shadow-[0_0_0_1px_rgba(59,130,246,0.25)]' : 'border-border'
                )}
                aria-pressed={isSelected}
              >
                <p className="text-sm font-semibold text-card-foreground">{voice.name}</p>
                <p className="text-[11px] text-muted-foreground mt-1">{voice.characterArchetype ?? voice.description}</p>
              </button>
            )
          })}
        </div>

        {activeVoice ? (
          <div
            className={cn(
              'mt-4 rounded-xl border bg-gradient-to-br p-4',
              paletteClasses[activeVoice.paletteKey ?? 'violet']
            )}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-2">
                <p className="text-base font-semibold text-foreground">{activeVoice.name}</p>
                <div className="flex flex-wrap gap-2 text-xs">
                  {activeVoice.gender ? (
                    <span className="rounded-full border border-border/70 bg-background/40 px-2 py-1 text-foreground">
                      {activeVoice.gender}
                    </span>
                  ) : null}
                  {activeVoice.accent ? (
                    <span className="rounded-full border border-border/70 bg-background/40 px-2 py-1 text-foreground">
                      {activeVoice.accent}
                    </span>
                  ) : null}
                  {(activeVoice.toneTags ?? []).map((toneTag) => (
                    <span
                      key={toneTag}
                      className="rounded-full border border-border/70 bg-background/40 px-2 py-1 text-foreground"
                    >
                      {toneTag}
                    </span>
                  ))}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  const audio = audioRefs.current[activeVoice.id]
                  if (!audio) return
                  if (audio.paused) {
                    void playVoice(activeVoice.id)
                    return
                  }
                  audio.pause()
                  setIsPlaying(false)
                }}
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-background/50 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-background/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                aria-label={isPlaying ? 'Pause preview' : 'Play preview'}
              >
                {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
                {isPlaying ? 'Pause preview' : 'Play preview'}
              </button>
            </div>

            <div className="mt-4">
              <div className="flex items-center gap-1.5" aria-hidden>
                {Array.from({ length: 8 }).map((_, barIndex) => (
                  <span
                    key={`${activeVoice.id}-${barIndex}`}
                    className={cn(
                      'w-1 rounded-full bg-foreground/80',
                      isPlaying && !reduceMotion
                        ? 'animate-[voicePulse_0.9s_ease-in-out_infinite]'
                        : 'h-2 opacity-60'
                    )}
                    style={
                      isPlaying && !reduceMotion
                        ? ({ height: `${10 + (barIndex % 4) * 5}px`, animationDelay: `${barIndex * 0.08}s` } as CSSProperties)
                        : ({ height: `${8 + (barIndex % 3) * 3}px` } as CSSProperties)
                    }
                  />
                ))}
              </div>
            </div>

            <details className="mt-4 group">
              <summary className="cursor-pointer text-xs text-foreground/85 hover:text-foreground">
                See line
              </summary>
              <p className="mt-2 text-xs text-foreground/80">“{activeVoice.sampleText}”</p>
            </details>
          </div>
        ) : null}
      </div>

      {voices.map((voice) => (
        <audio
          key={voice.id}
          ref={(node) => {
            audioRefs.current[voice.id] = node
          }}
          preload="none"
          src={voice.sampleAudioUrl}
          onPlay={() => setIsPlaying(voice.id === activeVoiceId)}
          onEnded={() => setIsPlaying(false)}
          onPause={() => setIsPlaying(false)}
          className="hidden"
        />
      ))}

      <style jsx>{`
        @keyframes voicePulse {
          0%,
          100% {
            transform: scaleY(0.5);
            opacity: 0.65;
          }
          50% {
            transform: scaleY(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}
