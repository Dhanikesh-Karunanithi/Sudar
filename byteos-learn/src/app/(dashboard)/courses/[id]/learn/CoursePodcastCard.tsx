'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Play, Pause, Volume2, VolumeX, Mic, User } from 'lucide-react'
import type { DialogueSegment } from '@/types/content'

function formatTime(secs: number) {
  const m = Math.floor(secs / 60)
  const s = Math.floor(secs % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function CoursePodcastCard({
  dialogue,
  courseTitle,
}: {
  dialogue: DialogueSegment[]
  courseTitle: string
}) {
  const [currentSegment, setCurrentSegment] = useState(-1)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [volume, setVolume] = useState(1)
  const [elapsed, setElapsed] = useState(0)
  const [segProgress, setSegProgress] = useState(0)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const segRefs = useRef<(HTMLDivElement | null)[]>([])
  const currentSegRef = useRef(-1)
  const isPlayingRef = useRef(false)
  const elapsedTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const elapsedStartRef = useRef(0)

  currentSegRef.current = currentSegment
  isPlayingRef.current = isPlaying

  const totalSegments = dialogue.length
  const hasAudio = dialogue.some((s) => s.audioDataURL)

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.onended = null
      audioRef.current.ontimeupdate = null
      audioRef.current = null
    }
    if (elapsedTimerRef.current) {
      clearInterval(elapsedTimerRef.current)
      elapsedTimerRef.current = null
    }
  }, [])

  // Plays the segment at `idx` and chains forward on `onended`
  const playFrom = useCallback((idx: number) => {
    stopAudio()
    if (idx >= totalSegments) {
      setIsPlaying(false)
      setCurrentSegment(totalSegments - 1)
      return
    }

    setCurrentSegment(idx)
    currentSegRef.current = idx
    setSegProgress(0)

    const seg = dialogue[idx]
    if (!seg.audioDataURL) {
      // No audio for this segment — skip after a short pause
      const t = setTimeout(() => {
        playFrom(idx + 1)
      }, 600)
      return () => clearTimeout(t)
    }

    const audio = new Audio(seg.audioDataURL)
    audio.volume = volume
    audio.muted = isMuted
    audioRef.current = audio

    audio.ontimeupdate = () => {
      if (audio.duration) setSegProgress((audio.currentTime / audio.duration) * 100)
    }

    audio.onended = () => {
      setSegProgress(100)
      playFrom(currentSegRef.current + 1)
    }

    audio.play().catch(() => {
      // fallback: skip
      setTimeout(() => playFrom(idx + 1), 400)
    })

    // Elapsed timer
    elapsedStartRef.current = Date.now()
    elapsedTimerRef.current = setInterval(() => {
      setElapsed((e) => e + 1)
    }, 1000)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dialogue, totalSegments, volume, isMuted, stopAudio])

  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      audioRef.current?.pause()
      if (elapsedTimerRef.current) {
        clearInterval(elapsedTimerRef.current)
        elapsedTimerRef.current = null
      }
      setIsPlaying(false)
    } else {
      setIsPlaying(true)
      if (audioRef.current && currentSegment >= 0) {
        audioRef.current.play().catch(() => {})
        elapsedTimerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000)
      } else {
        playFrom(Math.max(0, currentSegment))
      }
    }
  }, [isPlaying, currentSegment, playFrom])

  // Start playback from beginning when first pressed
  useEffect(() => {
    if (isPlaying && currentSegment < 0) {
      playFrom(0)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying])

  // Keep volume/mute in sync
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume
      audioRef.current.muted = isMuted
    }
  }, [volume, isMuted])

  // Scroll active segment into view
  useEffect(() => {
    if (currentSegment >= 0 && segRefs.current[currentSegment]) {
      segRefs.current[currentSegment]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [currentSegment])

  // Cleanup on unmount
  useEffect(() => {
    return () => stopAudio()
  }, [stopAudio])

  const overallProgress = totalSegments > 0
    ? ((Math.max(0, currentSegment) + (currentSegment >= 0 ? segProgress / 100 : 0)) / totalSegments) * 100
    : 0

  if (!dialogue?.length) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center space-y-3">
        <Mic className="w-10 h-10 text-muted-foreground mx-auto" />
        <p className="text-sm text-muted-foreground">No podcast for this course.</p>
      </div>
    )
  }

  return (
    <>
      <style>{`
        @keyframes podcastPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(169,119,184,0.35); }
          50% { box-shadow: 0 0 0 10px rgba(169,119,184,0); }
        }
        .podcast-play-btn-active { animation: podcastPulse 2s ease-in-out infinite; }

        @keyframes progressShimmer {
          0% { background-position: 0% 0%; }
          100% { background-position: 200% 0%; }
        }
        .podcast-progress-bar {
          background: linear-gradient(90deg, #cc8991, #a977b8, #cc8991);
          background-size: 200% 100%;
          animation: progressShimmer 3s linear infinite;
        }

        .podcast-segment-active {
          border-left: 3px solid #a977b8 !important;
          background: linear-gradient(90deg, rgba(169,119,184,0.08) 0%, transparent 100%) !important;
        }
        .podcast-vol-slider { accent-color: #a977b8; }
      `}</style>

      <div className="max-w-2xl mx-auto py-6 space-y-5">

        {/* Header */}
        <div className="text-center space-y-1">
          <h2
            className="text-2xl font-extrabold uppercase tracking-tight"
            style={{
              background: 'linear-gradient(to right, #a977b8, #cc8991)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {courseTitle}
          </h2>
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium">Podcast Episode</p>
        </div>

        {/* Audio player panel */}
        <div className="rounded-2xl border border-border bg-card p-6 space-y-5 shadow-sm">

          {/* Play / pause */}
          <div className="flex justify-center">
            <button
              onClick={handlePlayPause}
              className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95 ${isPlaying ? 'podcast-play-btn-active' : ''}`}
              style={{ background: 'linear-gradient(135deg, #cc8991, #a977b8)' }}
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying
                ? <Pause className="w-7 h-7 text-white" />
                : <Play className="w-7 h-7 text-white ml-1" />}
            </button>
          </div>

          {/* Overall progress bar */}
          <div>
            <div
              className="relative w-full h-2 rounded-full overflow-hidden cursor-pointer"
              style={{ background: 'rgba(0,0,0,0.1)' }}
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect()
                const frac = (e.clientX - rect.left) / rect.width
                const targetIdx = Math.floor(frac * totalSegments)
                const clamped = Math.max(0, Math.min(totalSegments - 1, targetIdx))
                stopAudio()
                setSegProgress(0)
                setIsPlaying(true)
                playFrom(clamped)
              }}
            >
              <div
                className="h-full podcast-progress-bar rounded-full transition-all duration-100"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
            <div className="flex justify-between mt-1.5 text-xs text-muted-foreground">
              <span>{formatTime(elapsed)}</span>
              <span>{currentSegment >= 0 ? currentSegment + 1 : 0} / {totalSegments} segments</span>
            </div>
          </div>

          {/* Volume */}
          <div className="flex items-center gap-3">
            <button onClick={() => setIsMuted((m) => !m)} className="shrink-0">
              {isMuted || volume === 0
                ? <VolumeX className="w-4 h-4 text-muted-foreground" />
                : <Volume2 className="w-4 h-4 text-muted-foreground" />}
            </button>
            <input
              type="range"
              min={0}
              max={100}
              value={isMuted ? 0 : Math.round(volume * 100)}
              onChange={(e) => {
                const v = Number(e.target.value) / 100
                setVolume(v)
                if (v > 0) setIsMuted(false)
              }}
              className="flex-1 h-1.5 rounded-full podcast-vol-slider cursor-pointer"
              style={{ background: `linear-gradient(to right, #a977b8 ${isMuted ? 0 : Math.round(volume * 100)}%, rgba(0,0,0,0.12) ${isMuted ? 0 : Math.round(volume * 100)}%)` }}
            />
            {!hasAudio && (
              <span className="text-xs text-amber-600 shrink-0">No audio — generate in Studio</span>
            )}
          </div>
        </div>

        {/* Live transcript */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
          <div className="px-5 py-3 border-b border-border bg-muted/40">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Transcript</p>
          </div>
          <div className="divide-y divide-border max-h-96 overflow-y-auto">
            {dialogue.map((seg, i) => {
              const isHost = seg.speaker === 'host'
              const isActive = i === currentSegment
              return (
                <div
                  key={i}
                  ref={(el) => { segRefs.current[i] = el }}
                  className={`flex gap-3 px-5 py-4 cursor-pointer transition-all duration-300 border-l-2 border-transparent ${
                    isActive ? 'podcast-segment-active' : 'hover:bg-muted/30'
                  }`}
                  onClick={() => {
                    stopAudio()
                    setSegProgress(0)
                    setIsPlaying(true)
                    playFrom(i)
                  }}
                >
                  {/* Avatar */}
                  <div
                    className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs"
                    style={{
                      background: isHost
                        ? 'linear-gradient(135deg, #cc8991, #e0a8af)'
                        : 'linear-gradient(135deg, #a977b8, #c49fd4)',
                    }}
                  >
                    {isHost ? <Mic className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-[10px] font-semibold uppercase tracking-wider mb-1"
                      style={{ color: isHost ? '#cc8991' : '#a977b8' }}
                    >
                      {seg.speaker}
                    </p>
                    <p
                      className={`text-sm leading-relaxed transition-colors ${
                        isActive ? 'text-card-foreground font-medium' : 'text-muted-foreground'
                      }`}
                    >
                      {seg.text}
                    </p>
                  </div>

                  {/* Active indicator */}
                  {isActive && isPlaying && (
                    <div className="shrink-0 flex items-center gap-0.5 self-center">
                      {[0, 150, 300].map((delay) => (
                        <span
                          key={delay}
                          className="w-0.5 rounded-full"
                          style={{
                            height: '14px',
                            background: '#a977b8',
                            animation: 'moveVertical 0.8s ease-in-out infinite',
                            animationDelay: `${delay}ms`,
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </>
  )
}
