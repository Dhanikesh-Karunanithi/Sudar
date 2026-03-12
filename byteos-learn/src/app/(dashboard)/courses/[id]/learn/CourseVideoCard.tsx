'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react'
import type { VideoScene } from '@/types/content'

type AnimType = 'kinetic' | 'word-reveal' | 'fade' | 'list'

function pickAnimation(scene: VideoScene, index: number): AnimType {
  if (index === 0) return 'kinetic'
  const narration = scene.narration ?? ''
  if (narration.includes('\n') || narration.includes('•') || narration.includes('-')) return 'list'
  if (index % 3 === 0) return 'kinetic'
  if (index % 3 === 1) return 'word-reveal'
  return 'fade'
}

function WordReveal({ text, delay = 0 }: { text: string; delay?: number }) {
  const words = text.split(' ')
  return (
    <span>
      {words.map((word, i) => (
        <span
          key={i}
          className="word-reveal-word"
          style={{ animationDelay: `${delay + i * 120}ms` }}
        >
          {word}{' '}
        </span>
      ))}
    </span>
  )
}

function SceneContent({ scene, animType, animKey }: { scene: VideoScene; animType: AnimType; animKey: number }) {
  const lines = (scene.narration ?? '').split('\n').filter(Boolean)

  if (animType === 'kinetic') {
    return (
      <div key={animKey} className="scene-kinetic space-y-4 text-center px-4">
        <h2 className="scene-title kinetic-heading">{scene.title || `Scene ${scene.sceneNumber}`}</h2>
        <p className="scene-narration kinetic-body">{scene.narration}</p>
        {scene.visuals && (
          <p className="scene-visuals">Visuals: {scene.visuals}</p>
        )}
      </div>
    )
  }

  if (animType === 'word-reveal') {
    return (
      <div key={animKey} className="scene-wordreveal space-y-4 text-center px-4">
        <h2 className="scene-title fade-heading">{scene.title || `Scene ${scene.sceneNumber}`}</h2>
        <p className="scene-narration text-lg leading-relaxed">
          <WordReveal text={scene.narration ?? ''} delay={300} />
        </p>
        {scene.visuals && (
          <p className="scene-visuals" style={{ animationDelay: '600ms' }}>Visuals: {scene.visuals}</p>
        )}
      </div>
    )
  }

  if (animType === 'list') {
    return (
      <div key={animKey} className="scene-list space-y-4 px-4 max-w-xl mx-auto">
        <h2 className="scene-title fade-heading">{scene.title || `Scene ${scene.sceneNumber}`}</h2>
        <ul className="space-y-3">
          {lines.map((line, i) => (
            <li
              key={i}
              className="list-item-anim flex items-start gap-2 text-base"
              style={{ animationDelay: `${300 + i * 200}ms` }}
            >
              <span className="mt-1 w-2 h-2 rounded-full bg-orb-accent shrink-0" />
              {line.replace(/^[-•]\s*/, '')}
            </li>
          ))}
        </ul>
      </div>
    )
  }

  // fade
  return (
    <div key={animKey} className="scene-fade space-y-4 text-center px-4">
      <h2 className="scene-title fade-heading">{scene.title || `Scene ${scene.sceneNumber}`}</h2>
      {lines.map((line, i) => (
        <p
          key={i}
          className="scene-narration fade-para"
          style={{ animationDelay: `${200 + i * 200}ms` }}
        >
          {line}
        </p>
      ))}
      {scene.visuals && (
        <p className="scene-visuals fade-para" style={{ animationDelay: `${200 + lines.length * 200}ms` }}>
          Visuals: {scene.visuals}
        </p>
      )}
    </div>
  )
}

export function CourseVideoCard({ scenes, courseTitle }: { scenes: VideoScene[]; courseTitle: string }) {
  const [phase, setPhase] = useState<'intro' | 'playing'>('intro')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [animKey, setAnimKey] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [progress, setProgress] = useState(0)

  // Cursor-follow state for the interactive orb
  const [cursorOrb, setCursorOrb] = useState({ x: 50, y: 50 })
  const containerRef = useRef<HTMLDivElement>(null)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const currentIndexRef = useRef(currentIndex)
  const isPlayingRef = useRef(isPlaying)

  currentIndexRef.current = currentIndex
  isPlayingRef.current = isPlaying

  const scene = scenes[currentIndex]
  const hasAudio = scenes.some((s) => s.audioDataURL)

  // Cursor-follow handler — updates orb position as percentage of container
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    let rafId: number
    const handleMouseMove = (e: MouseEvent) => {
      cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect()
        const x = ((e.clientX - rect.left) / rect.width) * 100
        const y = ((e.clientY - rect.top) / rect.height) * 100
        setCursorOrb({ x, y })
      })
    }
    el.addEventListener('mousemove', handleMouseMove)
    return () => {
      el.removeEventListener('mousemove', handleMouseMove)
      cancelAnimationFrame(rafId)
    }
  }, [])

  const clearTimer = useCallback(() => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null }
    if (progressRef.current) { clearInterval(progressRef.current); progressRef.current = null }
  }, [])

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.onended = null
      audioRef.current.ontimeupdate = null
      audioRef.current = null
    }
  }, [])

  const advanceScene = useCallback(() => {
    const next = currentIndexRef.current + 1
    if (next < scenes.length) {
      setCurrentIndex(next)
      setAnimKey((k) => k + 1)
    } else {
      setIsPlaying(false)
    }
  }, [scenes.length])

  const startScenePlayback = useCallback((idx: number, play: boolean) => {
    clearTimer()
    stopAudio()
    setProgress(0)

    if (!play) return

    const s = scenes[idx]
    if (s?.audioDataURL) {
      const audio = new Audio(s.audioDataURL)
      audioRef.current = audio
      audio.muted = isMuted
      audio.ontimeupdate = () => {
        if (audio.duration) setProgress((audio.currentTime / audio.duration) * 100)
      }
      audio.onended = () => {
        setProgress(100)
        setTimeout(advanceScene, 400)
      }
      audio.play().catch(() => {
        const duration = (s.duration ?? 5) * 1000
        startFallbackTimer(duration)
      })
    } else {
      const duration = (s?.duration ?? 5) * 1000
      startFallbackTimer(duration)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenes, isMuted, clearTimer, stopAudio, advanceScene])

  function startFallbackTimer(duration: number) {
    const start = Date.now()
    progressRef.current = setInterval(() => {
      const elapsed = Date.now() - start
      setProgress(Math.min((elapsed / duration) * 100, 100))
    }, 100)
    timerRef.current = setTimeout(() => {
      clearTimer()
      advanceScene()
    }, duration)
  }

  useEffect(() => {
    startScenePlayback(currentIndex, isPlaying)
    return () => { clearTimer(); stopAudio() }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, isPlaying])

  useEffect(() => {
    if (audioRef.current) audioRef.current.muted = isMuted
  }, [isMuted])

  // Auto-dismiss intro and start playback
  useEffect(() => {
    if (phase !== 'intro') return
    const t = setTimeout(() => {
      setPhase('playing')
      setIsPlaying(true)
    }, 2400)
    return () => clearTimeout(t)
  }, [phase])

  const handlePlayPause = () => {
    if (phase === 'intro') {
      setPhase('playing')
      setIsPlaying(true)
      return
    }
    setIsPlaying((p) => !p)
  }

  const handlePrev = () => {
    clearTimer(); stopAudio()
    const prev = Math.max(0, currentIndex - 1)
    setCurrentIndex(prev)
    setAnimKey((k) => k + 1)
    setProgress(0)
  }

  const handleNext = () => {
    clearTimer(); stopAudio()
    const next = Math.min(scenes.length - 1, currentIndex + 1)
    setCurrentIndex(next)
    setAnimKey((k) => k + 1)
    setProgress(0)
  }

  const animType = pickAnimation(scene, currentIndex)

  return (
    <>
      <style>{`
        /* Orb animations — use theme CSS variables for color */
        @keyframes moveInCircle {
          0% { transform: rotate(0deg); }
          50% { transform: rotate(180deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes moveVertical {
          0% { transform: translateY(-40%); }
          50% { transform: translateY(40%); }
          100% { transform: translateY(-40%); }
        }
        @keyframes moveHorizontal {
          0% { transform: translateX(-40%) translateY(-10%); }
          50% { transform: translateX(40%) translateY(10%); }
          100% { transform: translateX(-40%) translateY(-10%); }
        }

        .orb {
          position: absolute;
          border-radius: 50%;
          mix-blend-mode: multiply;
          filter: blur(70px);
          opacity: 0.6;
          pointer-events: none;
        }

        /* Accent orb — top-left, driven by --primary */
        .orb1 {
          width: 60%;
          height: 60%;
          top: -15%;
          left: -10%;
          background: radial-gradient(circle at center, color-mix(in srgb, var(--primary, #a977b8) 90%, transparent), transparent 70%);
          animation: moveInCircle 18s ease-in-out infinite;
        }

        /* Secondary orb — bottom-right, driven by bg mixed with accent */
        .orb2 {
          width: 55%;
          height: 55%;
          bottom: -10%;
          right: -10%;
          background: radial-gradient(circle at center, color-mix(in srgb, var(--primary, #6366f1) 60%, var(--background, #fff) 40%), transparent 70%);
          animation: moveVertical 14s ease-in-out infinite;
        }

        /* Mid orb */
        .orb3 {
          width: 40%;
          height: 40%;
          top: 35%;
          left: 25%;
          background: radial-gradient(circle at center, color-mix(in srgb, var(--primary, #cc8991) 50%, transparent), transparent 70%);
          animation: moveHorizontal 22s ease-in-out infinite;
        }

        /* Cursor-follow orb — positioned via inline style, smooth CSS transition */
        .orb-cursor {
          width: 30%;
          height: 30%;
          filter: blur(50px);
          opacity: 0.45;
          mix-blend-mode: multiply;
          pointer-events: none;
          position: absolute;
          border-radius: 50%;
          transition: left 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94),
                      top 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          background: radial-gradient(circle at center, color-mix(in srgb, var(--primary, #a977b8) 80%, transparent), transparent 70%);
          transform: translate(-50%, -50%);
        }

        /* Intro */
        @keyframes introFadeIn {
          0% { opacity: 0; transform: scale(0.7); }
          60% { opacity: 1; transform: scale(1.05); }
          100% { opacity: 1; transform: scale(1); }
        }
        .intro-logo { animation: introFadeIn 1.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }

        /* Kinetic heading */
        @keyframes kineticIn {
          0% { opacity: 0; transform: scale(0.6) translateY(20px); }
          70% { opacity: 1; transform: scale(1.04) translateY(-4px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        .kinetic-heading { animation: kineticIn 900ms cubic-bezier(0.34, 1.56, 0.64, 1) both; }
        .kinetic-body { animation: kineticIn 900ms 200ms cubic-bezier(0.34, 1.56, 0.64, 1) both; }

        /* Fade */
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-heading { animation: fadeUp 700ms ease-out both; }
        .fade-para { animation: fadeUp 700ms ease-out both; opacity: 0; }

        /* Word reveal */
        .word-reveal-word {
          display: inline-block;
          opacity: 0;
          transform: translateY(8px);
          animation: fadeUp 400ms ease-out forwards;
        }

        /* List items */
        @keyframes listItemIn {
          from { opacity: 0; transform: translateX(-16px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .list-item-anim { opacity: 0; animation: listItemIn 500ms ease-out forwards; }

        /* Scene text styles — uses theme foreground */
        .scene-title {
          font-size: clamp(1.4rem, 3vw, 2.2rem);
          font-weight: 800;
          line-height: 1.2;
          letter-spacing: -0.02em;
          color: var(--foreground, #191919);
        }
        .scene-narration {
          font-size: clamp(0.95rem, 1.5vw, 1.15rem);
          line-height: 1.75;
          color: color-mix(in srgb, var(--foreground, #333) 80%, transparent);
        }
        .scene-visuals {
          font-size: 0.82rem;
          color: color-mix(in srgb, var(--foreground, #888) 50%, transparent);
          font-style: italic;
        }
        .bg-orb-accent { background-color: var(--primary, #cc8991); }

        /* Progress bar shimmer — uses theme accent */
        @keyframes shimmer {
          0% { background-position: 0% 0%; }
          100% { background-position: 200% 0%; }
        }
        .progress-shimmer {
          background: linear-gradient(
            90deg,
            var(--primary, #cc8991),
            color-mix(in srgb, var(--primary, #cc8991) 60%, white),
            var(--primary, #cc8991)
          );
          background-size: 200% 100%;
          animation: shimmer 3s linear infinite;
        }
      `}</style>

      <div
        ref={containerRef}
        className="relative w-full rounded-2xl overflow-hidden border border-border shadow-xl"
        style={{
          minHeight: '480px',
          height: 'clamp(480px, calc(100vh - 260px), 680px)',
          background: `color-mix(in srgb, var(--background, #fff) 70%, color-mix(in srgb, var(--primary, #a977b8) 20%, transparent))`,
        }}
      >
        {/* Animated gradient orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
          <div className="orb orb1" />
          <div className="orb orb2" />
          <div className="orb orb3" />
          {/* Cursor-following orb */}
          <div
            className="orb-cursor"
            style={{ left: `${cursorOrb.x}%`, top: `${cursorOrb.y}%` }}
          />
        </div>

        {/* Intro overlay */}
        {phase === 'intro' && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-6 bg-white/10 backdrop-blur-sm">
            <img
              src="/sudar-chat-logo.png"
              alt="Sudar"
              className="intro-logo w-20 h-20 object-contain"
              style={{ filter: 'drop-shadow(0 4px 24px color-mix(in srgb, var(--primary, #a977b8) 60%, transparent))' }}
            />
            <p
              className="intro-logo text-sm font-semibold tracking-widest uppercase"
              style={{ color: `var(--foreground, #333)`, animationDelay: '600ms' }}
            >
              {courseTitle}
            </p>
          </div>
        )}

        {/* Scene content — fills the card */}
        {phase === 'playing' && (
          <div
            className="relative z-10 flex items-center justify-center px-8 py-10"
            style={{ minHeight: 'calc(100% - 68px)' }}
          >
            <div className="w-full max-w-3xl mx-auto">
              <SceneContent scene={scene} animType={animType} animKey={animKey} />
            </div>
          </div>
        )}

        {/* Scene counter */}
        {phase === 'playing' && (
          <div
            className="absolute top-4 right-4 z-10 px-3 py-1 rounded-full text-xs font-semibold"
            style={{
              background: 'rgba(255,255,255,0.55)',
              backdropFilter: 'blur(8px)',
              color: 'var(--foreground, #555)',
              border: '1px solid rgba(0,0,0,0.1)',
            }}
          >
            {currentIndex + 1} / {scenes.length}
          </div>
        )}

        {/* Audio indicator */}
        {!hasAudio && phase === 'playing' && (
          <div className="absolute top-4 left-4 z-10 px-2 py-1 rounded text-xs text-amber-700 bg-amber-50/80 border border-amber-200">
            No audio — generate in Studio
          </div>
        )}

        {/* Bottom control bar */}
        <div
          className="absolute bottom-0 inset-x-0 z-10 flex items-center gap-3 px-5 py-3"
          style={{
            background: 'rgba(255,255,255,0.55)',
            backdropFilter: 'blur(16px)',
            borderTop: '1px solid rgba(0,0,0,0.08)',
          }}
        >
          {/* Prev */}
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="p-2 rounded-full transition-all hover:bg-white/60 disabled:opacity-30"
            title="Previous scene"
          >
            <SkipBack className="w-4 h-4" style={{ color: 'var(--foreground, #333)' }} />
          </button>

          {/* Play/Pause */}
          <button
            onClick={handlePlayPause}
            className="w-11 h-11 rounded-full flex items-center justify-center shadow-md transition-transform hover:scale-105 active:scale-95 shrink-0"
            style={{ background: 'var(--primary, #a977b8)' }}
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying
              ? <Pause className="w-5 h-5 text-white" />
              : <Play className="w-5 h-5 text-white ml-0.5" />}
          </button>

          {/* Next */}
          <button
            onClick={handleNext}
            disabled={currentIndex === scenes.length - 1}
            className="p-2 rounded-full transition-all hover:bg-white/60 disabled:opacity-30"
            title="Next scene"
          >
            <SkipForward className="w-4 h-4" style={{ color: 'var(--foreground, #333)' }} />
          </button>

          {/* Progress bar */}
          <div
            className="flex-1 h-2 rounded-full overflow-hidden cursor-pointer"
            style={{ background: 'rgba(0,0,0,0.12)' }}
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect()
              const frac = (e.clientX - rect.left) / rect.width
              const targetIndex = Math.floor(frac * scenes.length)
              const clamped = Math.max(0, Math.min(scenes.length - 1, targetIndex))
              clearTimer(); stopAudio()
              setCurrentIndex(clamped)
              setAnimKey((k) => k + 1)
              setProgress(0)
            }}
          >
            <div
              className="h-full progress-shimmer transition-all duration-100 rounded-full"
              style={{ width: `${((currentIndex + progress / 100) / scenes.length) * 100}%` }}
            />
          </div>

          {/* Time display */}
          <span
            className="text-xs font-medium shrink-0"
            style={{ color: 'var(--foreground, #555)', minWidth: '52px', textAlign: 'center' }}
          >
            {currentIndex + 1} / {scenes.length}
          </span>

          {/* Mute */}
          <button
            onClick={() => setIsMuted((m) => !m)}
            className="p-2 rounded-full transition-all hover:bg-white/60"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted
              ? <VolumeX className="w-4 h-4" style={{ color: 'var(--foreground, #555)' }} />
              : <Volume2 className="w-4 h-4" style={{ color: 'var(--foreground, #555)' }} />}
          </button>
        </div>
      </div>
    </>
  )
}
