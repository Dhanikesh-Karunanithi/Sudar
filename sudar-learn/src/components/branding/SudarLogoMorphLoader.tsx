'use client'

import { useEffect, useLayoutEffect, useState } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { motion, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { SudarLogoMark } from '@/components/branding/SudarLogo'

export const SUDAR_LOGO_MORPH_EXIT_MS = 680

const NAV_LOGO_SELECTOR = '[data-sudar-nav-logo]'
const APP_SHELL_SELECTOR = '[data-sudar-app-shell]'

type Phase = 'enter' | 'loading' | 'exit'

type MorphMetrics = {
  fromRect: DOMRect
  centerX: number
  centerY: number
  centerSize: number
}

let portalEl: HTMLDivElement | null = null
let portalRoot: Root | null = null
let exitTimer: ReturnType<typeof setTimeout> | null = null
let activeHosts = 0
let setPortalPhase: ((phase: Phase) => void) | null = null
let cachedMorph: MorphMetrics | null = null

function measureMorphMetrics(): MorphMetrics | null {
  const el = document.querySelector(NAV_LOGO_SELECTOR) as HTMLElement | null
  if (!el) return null
  const fromRect = el.getBoundingClientRect()
  if (fromRect.width <= 0 || fromRect.height <= 0) return null
  const centerSize = Math.min(152, Math.max(108, fromRect.width * 3.1))
  return {
    fromRect,
    centerX: window.innerWidth / 2,
    centerY: window.innerHeight / 2,
    centerSize,
  }
}

function setNavLogoHidden(hidden: boolean) {
  const el = document.querySelector(NAV_LOGO_SELECTOR) as HTMLElement | null
  if (!el) return
  el.style.visibility = hidden ? 'hidden' : ''
}

function resetShellTransform() {
  const shell = document.querySelector(APP_SHELL_SELECTOR) as HTMLElement | null
  if (!shell) return
  shell.getAnimations().forEach((anim) => anim.cancel())
  shell.style.removeProperty('transform')
  shell.style.removeProperty('opacity')
  shell.style.removeProperty('filter')
  shell.style.removeProperty('transform-origin')
}

function LogoMorphOverlay({ phase, label }: { phase: Phase; label?: string }) {
  const reduceMotion = useReducedMotion()
  const [metrics, setMetrics] = useState<MorphMetrics | null>(() => cachedMorph)

  useLayoutEffect(() => {
    const next = measureMorphMetrics()
    if (next) {
      cachedMorph = next
      setMetrics(next)
      setNavLogoHidden(true)
    }
    return () => setNavLogoHidden(false)
  }, [])

  useEffect(() => {
    if (phase !== 'enter') return
    const id = window.setTimeout(() => setPortalPhase?.('loading'), 540)
    return () => window.clearTimeout(id)
  }, [phase])

  if (!metrics) return null

  const { fromRect, centerX, centerY, centerSize } = metrics
  const atCenter = phase === 'enter' || phase === 'loading'

  const box = atCenter
    ? {
        left: centerX - centerSize / 2,
        top: centerY - centerSize / 2,
        width: centerSize,
        height: centerSize,
      }
    : {
        left: fromRect.left,
        top: fromRect.top,
        width: fromRect.width,
        height: fromRect.height,
      }

  const enterSpring = { type: 'spring' as const, stiffness: 300, damping: 30, mass: 0.92 }
  const exitSpring = { type: 'spring' as const, stiffness: 360, damping: 32, mass: 0.88 }

  if (reduceMotion) {
    return (
      <div
        className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-4 bg-background/80 backdrop-blur-xl"
        role="status"
        aria-live="polite"
        aria-busy={phase !== 'exit'}
        aria-label={label ?? 'Loading'}
      >
        <SudarLogoMark className="h-16 w-16 text-primary" starFill="var(--card)" />
        {label ? <p className="text-sm font-medium text-muted-foreground">{label}</p> : null}
      </div>
    )
  }

  return (
    <div
      className="fixed inset-0 z-[100] pointer-events-none"
      role="status"
      aria-live="polite"
      aria-busy={phase !== 'exit'}
      aria-label={label ?? 'Loading'}
    >
      <motion.div
        className="absolute inset-0 bg-background/72 backdrop-blur-2xl backdrop-saturate-150"
        initial={{ opacity: 0 }}
        animate={{ opacity: phase === 'exit' ? 0 : 1 }}
        transition={{ duration: phase === 'exit' ? 0.52 : 0.38, ease: [0.22, 1, 0.36, 1] }}
      />

      <motion.div
        className="fixed z-[101] sudar-logo-morph-glow"
        initial={{
          left: fromRect.left,
          top: fromRect.top,
          width: fromRect.width,
          height: fromRect.height,
        }}
        animate={box}
        transition={phase === 'exit' ? exitSpring : enterSpring}
      >
        <SudarLogoMark
          className="h-full w-full text-primary"
          starFill="var(--card)"
          motion={phase === 'loading' ? 'loading' : 'none'}
        />
      </motion.div>

      {label ? (
        <motion.p
          className={cn(
            'fixed left-0 right-0 text-center text-sm font-medium text-muted-foreground pointer-events-none',
            'bottom-[max(1.5rem,calc(50%-7.5rem))]'
          )}
          initial={{ opacity: 0, y: 10 }}
          animate={{
            opacity: phase === 'loading' ? 1 : 0,
            y: phase === 'loading' ? 0 : 8,
          }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
        >
          {label}
        </motion.p>
      ) : null}
    </div>
  )
}

function PortalApp({ label }: { label?: string }) {
  const [phase, setPhase] = useState<Phase>('enter')

  useEffect(() => {
    setPortalPhase = (next) => {
      setPhase(next)
    }
    return () => {
      setPortalPhase = null
    }
  }, [])

  return <LogoMorphOverlay phase={phase} label={label} />
}

function teardownPortal() {
  resetShellTransform()
  setNavLogoHidden(false)
  cachedMorph = null

  portalRoot?.unmount()
  portalEl?.remove()
  portalRoot = null
  portalEl = null
  exitTimer = null
  setPortalPhase = null
}

function mountPortal(label?: string) {
  if (exitTimer) {
    clearTimeout(exitTimer)
    exitTimer = null
  }
  resetShellTransform()
  cachedMorph = null

  if (!portalEl) {
    portalEl = document.createElement('div')
    portalEl.id = 'sudar-logo-morph-portal'
    document.body.appendChild(portalEl)
    portalRoot = createRoot(portalEl)
  }
  portalRoot?.render(<PortalApp label={label} />)
}

function schedulePortalExit() {
  setPortalPhase?.('exit')
  exitTimer = window.setTimeout(teardownPortal, SUDAR_LOGO_MORPH_EXIT_MS + 80)
}

/** Header logo morphs to center while loading, then returns to nav as overlay fades. */
export function SudarLogoMorphLoaderHost({
  label = 'Loading your space…',
}: {
  label?: string
}) {
  useEffect(() => {
    activeHosts += 1
    mountPortal(label)

    return () => {
      activeHosts = Math.max(0, activeHosts - 1)
      if (activeHosts === 0) {
        schedulePortalExit()
      }
    }
  }, [label])

  return null
}
