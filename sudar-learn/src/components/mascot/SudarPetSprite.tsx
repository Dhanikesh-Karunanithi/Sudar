'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { DEFAULT_SUDAR_PET_MANIFEST, type SudarPetManifest, type SudarPetState } from '@/lib/mascot/petSpriteManifest'

interface SudarPetSpriteProps {
  state: SudarPetState
  size?: number
  manifest?: SudarPetManifest
}

export function SudarPetSprite({
  state,
  size = 112,
  manifest = DEFAULT_SUDAR_PET_MANIFEST,
}: SudarPetSpriteProps) {
  const [frame, setFrame] = useState(0)
  const [sheetFailed, setSheetFailed] = useState(false)
  const stateMeta = manifest.states[state] ?? manifest.states.idle
  const fps = stateMeta.fps ?? manifest.fps
  const frameDurationMs = Math.max(50, Math.round(1000 / Math.max(1, fps)))

  useEffect(() => {
    setFrame(0)
  }, [state])

  useEffect(() => {
    let cancelled = false
    const probe = new window.Image()
    probe.onload = () => {
      if (!cancelled) setSheetFailed(false)
    }
    probe.onerror = () => {
      if (!cancelled) setSheetFailed(true)
    }
    probe.src = manifest.sheetSrc
    return () => {
      cancelled = true
    }
  }, [manifest.sheetSrc])

  useEffect(() => {
    if (sheetFailed) return
    const timer = window.setInterval(() => {
      setFrame((prev) => (prev + 1) % Math.max(1, stateMeta.frames))
    }, frameDurationMs)
    return () => window.clearInterval(timer)
  }, [frameDurationMs, sheetFailed, stateMeta.frames])

  const background = useMemo(() => {
    const x = frame * manifest.frameWidth
    const y = stateMeta.row * manifest.frameHeight
    return `-${x}px -${y}px`
  }, [frame, manifest.frameHeight, manifest.frameWidth, stateMeta.row])

  if (sheetFailed) {
    return (
      <Image
        src={manifest.placeholderSrc}
        alt="Sudar fire pet"
        width={size}
        height={size}
        className="select-none"
        unoptimized
      />
    )
  }

  return (
    <div
      aria-label="Sudar fire pet"
      role="img"
      className="select-none bg-no-repeat"
      style={{
        width: size,
        height: size,
        backgroundImage: `url(${manifest.sheetSrc})`,
        backgroundPosition: background,
        backgroundSize: 'auto',
        imageRendering: 'pixelated',
      }}
    />
  )
}
