'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { SudarPetCorner, SudarPetMode } from '@/lib/learner/learnerPreferences'
import { CHAT_OPEN_PET_EVENT, DEFAULT_SUDAR_PET_MANIFEST, type SudarPetState } from '@/lib/mascot/petSpriteManifest'
import { SudarPetSprite } from '@/components/mascot/SudarPetSprite'

interface SudarPetHostProps {
  userId: string
}

type PetPrefs = {
  enabled: boolean
  mode: SudarPetMode
  corner: SudarPetCorner
}

const SIZE = 112
const MARGIN = 24

function cornerTarget(corner: SudarPetCorner): { x: number; y: number } {
  const w = window.innerWidth
  const h = window.innerHeight
  const x = corner.includes('right') ? w - SIZE - MARGIN : MARGIN
  const y = corner.includes('bottom') ? h - SIZE - MARGIN : MARGIN
  return { x, y }
}

export function SudarPetHost({ userId }: SudarPetHostProps) {
  const [prefs, setPrefs] = useState<PetPrefs>({ enabled: false, mode: 'off', corner: 'bottom-right' })
  const [state, setState] = useState<SudarPetState>('idle')
  const [reducedMotion, setReducedMotion] = useState(false)
  const [mounted, setMounted] = useState(false)
  const posRef = useRef({ x: 0, y: 0 })
  const targetRef = useRef({ x: 0, y: 0 })
  const floatAnchorRef = useRef({ x: 0, y: 0 })
  const velocityRef = useRef({ x: 0, y: 0 })
  const [renderPos, setRenderPos] = useState({ x: 0, y: 0 })
  const reactionUntilRef = useRef(0)

  useEffect(() => {
    setMounted(true)
    const home = cornerTarget('bottom-right')
    posRef.current = home
    targetRef.current = home
    floatAnchorRef.current = home
    setRenderPos(home)
  }, [])

  useEffect(() => {
    let cancelled = false
    fetch('/api/learner/preferences')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data || cancelled) return
        const resolved = data.preferences as Record<string, unknown> | undefined
        setPrefs({
          enabled: resolved?.sudar_pet_enabled === true,
          mode: (resolved?.sudar_pet_mode as SudarPetMode) ?? 'off',
          corner: (resolved?.sudar_pet_corner as SudarPetCorner) ?? 'bottom-right',
        })
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [userId])

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReducedMotion(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (prefs.mode !== 'follow') return
      targetRef.current = {
        x: Math.min(window.innerWidth - SIZE - 8, Math.max(8, e.clientX - SIZE / 2)),
        y: Math.min(window.innerHeight - SIZE - 8, Math.max(8, e.clientY - SIZE / 2)),
      }
    }
    window.addEventListener('pointermove', handlePointerMove)
    return () => window.removeEventListener('pointermove', handlePointerMove)
  }, [prefs.mode])

  useEffect(() => {
    const onChatOpen = () => {
      reactionUntilRef.current = performance.now() + 1200
      setState('waving')
    }
    window.addEventListener(CHAT_OPEN_PET_EVENT, onChatOpen)
    return () => window.removeEventListener(CHAT_OPEN_PET_EVENT, onChatOpen)
  }, [])

  useEffect(() => {
    if (!mounted) return
    let raf = 0
    let last = performance.now()
    const home = cornerTarget(prefs.corner)
    targetRef.current = home
    floatAnchorRef.current = home

    const tick = (now: number) => {
      const dt = Math.min(0.033, (now - last) / 1000)
      last = now

      if (prefs.enabled && prefs.mode !== 'off') {
        const homePos = cornerTarget(prefs.corner)
        if (prefs.mode === 'corner' || reducedMotion) {
          targetRef.current = homePos
        } else if (prefs.mode === 'float') {
          const t = now / 1000
          targetRef.current = {
            x: homePos.x + Math.sin(t * 0.9) * 16,
            y: homePos.y + Math.cos(t * 1.3) * 10,
          }
        }

        const dx = targetRef.current.x - posRef.current.x
        const dy = targetRef.current.y - posRef.current.y
        const speed = prefs.mode === 'follow' ? 9 : 6
        const alpha = Math.min(1, speed * dt)
        const nextX = posRef.current.x + dx * alpha
        const nextY = posRef.current.y + dy * alpha

        velocityRef.current = { x: nextX - posRef.current.x, y: nextY - posRef.current.y }
        posRef.current = { x: nextX, y: nextY }
        setRenderPos(posRef.current)

        if (reactionUntilRef.current > now) {
          setState('waving')
        } else {
          const absVx = Math.abs(velocityRef.current.x)
          const absVy = Math.abs(velocityRef.current.y)
          if (prefs.mode === 'follow' && absVx > 0.5) {
            setState(velocityRef.current.x > 0 ? 'run_right' : 'run_left')
          } else if (prefs.mode === 'float' && (absVx > 0.15 || absVy > 0.15)) {
            setState('waiting')
          } else {
            setState('idle')
          }
        }
      }

      raf = window.requestAnimationFrame(tick)
    }

    raf = window.requestAnimationFrame(tick)
    return () => window.cancelAnimationFrame(raf)
  }, [mounted, prefs.corner, prefs.enabled, prefs.mode, reducedMotion])

  const hidden = useMemo(() => !prefs.enabled || prefs.mode === 'off', [prefs.enabled, prefs.mode])
  if (!mounted || hidden) return null

  return (
    <div
      className="fixed z-[55] pointer-events-none"
      style={{ transform: `translate3d(${renderPos.x}px, ${renderPos.y}px, 0)` }}
      aria-hidden
      data-sudar-pet-host=""
    >
      <SudarPetSprite state={state} size={SIZE} manifest={DEFAULT_SUDAR_PET_MANIFEST} />
    </div>
  )
}
