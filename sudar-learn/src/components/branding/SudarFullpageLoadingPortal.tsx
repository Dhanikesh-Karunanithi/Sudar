'use client'

import { useEffect, useRef, useState, type RefObject } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { cn } from '@/lib/utils'
import { SudarFullpageMark } from '@/components/branding/SudarPremiumLoader'

export const SUDAR_FULLPAGE_LOADER_EXIT_MS = 720

const APP_SHELL_SELECTOR = '[data-sudar-app-shell]'

const EXIT_EASING = 'cubic-bezier(0.22, 0.68, 0.32, 1)'

type Phase = 'warp' | 'exit'

type PortalOverlayProps = {
  phase: Phase
  label?: string
  overlayRef?: RefObject<HTMLDivElement | null>
  mainRef?: RefObject<HTMLDivElement | null>
}

function FullpagePortalOverlay({ phase, label, overlayRef, mainRef }: PortalOverlayProps) {
  return (
    <div
      ref={overlayRef}
      className={cn(
        'fixed inset-0 z-[100] flex flex-col items-center justify-center gap-4 p-6 sm:p-8',
        'bg-background/65 dark:bg-background/70 backdrop-blur-2xl backdrop-saturate-150',
        phase === 'exit' && 'sudar-fp-overlay-exit'
      )}
      role="status"
      aria-live="polite"
      aria-busy={phase === 'warp'}
      aria-label={label ?? 'Loading'}
    >
      <SudarFullpageMark phase={phase} mainRef={mainRef} className="max-w-full" />
      {label ? (
        <p className="text-sm font-medium text-muted-foreground text-center max-w-xs">{label}</p>
      ) : null}
    </div>
  )
}

function PortalApp({ label }: { label?: string }) {
  const [phase, setPhase] = useState<Phase>('warp')
  const overlayRef = useRef<HTMLDivElement>(null)
  const mainRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setPortalPhase = (next) => {
      if (next === 'exit') {
        playWarpExit(overlayRef.current, mainRef.current)
      }
      setPhase(next)
    }
    return () => {
      setPortalPhase = null
    }
  }, [])

  return (
    <FullpagePortalOverlay
      phase={phase}
      label={label}
      overlayRef={overlayRef}
      mainRef={mainRef}
    />
  )
}

let portalEl: HTMLDivElement | null = null
let portalRoot: Root | null = null
let exitTimer: ReturnType<typeof setTimeout> | null = null
let activeHosts = 0
let setPortalPhase: ((phase: Phase) => void) | null = null

function resetWarpTarget(el: HTMLElement | null) {
  if (!el) return
  el.getAnimations().forEach((anim) => anim.cancel())
  el.style.removeProperty('transform')
  el.style.removeProperty('opacity')
  el.style.removeProperty('filter')
}

function playWarpExit(overlayEl: HTMLDivElement | null, mainEl: HTMLDivElement | null) {
  if (typeof document === 'undefined') return

  document.body.classList.add('sudar-warp-exit-active')
  document.body.style.overflow = 'hidden'

  mainEl?.getAnimations().forEach((anim) => anim.cancel())

  const shell = document.querySelector(APP_SHELL_SELECTOR) as HTMLElement | null
  const targets = [overlayEl, shell].filter(Boolean) as HTMLElement[]

  const exitKeyframes: Keyframe[] = [
    { transform: 'translate3d(0px, 0px, 0px)', opacity: 1 },
    { transform: 'translate3d(6vw, 0px, 0px)', opacity: 1, offset: 0.12 },
    { transform: 'translate3d(28vw, 0px, 0px)', opacity: 1, offset: 0.38 },
    { transform: 'translate3d(62vw, 0px, 0px)', opacity: 0.92, offset: 0.68 },
    { transform: 'translate3d(102vw, 0px, 0px)', opacity: 0, offset: 1 },
  ]

  for (const el of targets) {
    if (typeof el.animate !== 'function') continue
    el.getAnimations().forEach((anim) => anim.cancel())
    el.animate(exitKeyframes, {
      duration: SUDAR_FULLPAGE_LOADER_EXIT_MS,
      easing: EXIT_EASING,
      fill: 'forwards',
    })
  }
}

function teardownPortal() {
  const shell = document.querySelector(APP_SHELL_SELECTOR) as HTMLElement | null
  resetWarpTarget(shell)
  document.body.classList.remove('sudar-warp-exit-active')
  document.body.style.removeProperty('overflow')

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
  document.body.classList.remove('sudar-warp-exit-active')
  document.body.style.removeProperty('overflow')

  if (!portalEl) {
    portalEl = document.createElement('div')
    portalEl.id = 'sudar-fullpage-loader-portal'
    document.body.appendChild(portalEl)
    portalRoot = createRoot(portalEl)
  }
  portalRoot?.render(<PortalApp label={label} />)
}

function schedulePortalExit() {
  setPortalPhase?.('exit')
  exitTimer = setTimeout(teardownPortal, SUDAR_FULLPAGE_LOADER_EXIT_MS + 40)
}

/** Mounts full-page warp loader on `document.body`; slides page + logo away when loading completes. */
export function SudarFullpageLoadingPortalHost({
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
