'use client'

import { SudarLogoMark } from '@/components/branding/SudarLogo'
import { cn } from '@/lib/utils'

interface HibernationAnimationProps {
  isWarning: boolean
  className?: string
}

const ZZZ_PARTICLES = [
  { label: 'z', delay: '0s', left: '58%', size: 'text-[10px]' },
  { label: 'Z', delay: '0.9s', left: '68%', size: 'text-xs' },
  { label: 'Z', delay: '1.8s', left: '48%', size: 'text-sm font-semibold' },
] as const

function CaveBackdrop() {
  return (
    <svg
      viewBox="0 0 120 88"
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full motion-safe:animate-hibernation-cave-glow motion-reduce:animate-none"
    >
      <defs>
        <linearGradient id="hibernation-cave-fill" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.08" />
          <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.22" />
        </linearGradient>
      </defs>
      <path
        d="M8 78 Q60 8 112 78 L112 88 L8 88 Z"
        fill="url(#hibernation-cave-fill)"
        stroke="var(--primary)"
        strokeOpacity="0.18"
        strokeWidth="1"
      />
      <ellipse cx="60" cy="82" rx="34" ry="5" fill="var(--primary)" fillOpacity="0.12" />
    </svg>
  )
}

function SleepingFaceOverlay() {
  return (
    <svg
      viewBox="0 0 44 24"
      aria-hidden="true"
      className="pointer-events-none absolute left-1/2 top-[25%] h-6 w-11 -translate-x-1/2"
    >
      <path
        d="M8 14 Q14 10 20 14"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="text-primary/70"
      />
      <path
        d="M24 14 Q30 10 36 14"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="text-primary/70"
      />
    </svg>
  )
}

function FloatingZzz({ isWarning }: { isWarning: boolean }) {
  return (
    <>
      {ZZZ_PARTICLES.map((particle, index) => (
        <span
          key={`${particle.label}-${index}`}
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute bottom-[52%] font-display font-bold leading-none text-primary/75 motion-reduce:animate-none motion-safe:animate-zzz-float',
            particle.size,
            isWarning && 'opacity-80'
          )}
          style={{
            left: particle.left,
            animationDelay: particle.delay,
            animationDuration: isWarning ? '3.6s' : '2.8s',
          }}
        >
          {particle.label}
        </span>
      ))}
    </>
  )
}

export function HibernationAnimation({ isWarning, className }: HibernationAnimationProps) {
  return (
    <div
      className={cn(
        'relative mx-auto flex h-24 w-24 items-center justify-center overflow-visible rounded-2xl border border-primary/30 bg-primary/10',
        className
      )}
      aria-hidden="true"
    >
      <CaveBackdrop />

      <div
        className={cn(
          'relative z-10 motion-reduce:animate-none',
          isWarning
            ? 'motion-safe:animate-hibernation-warning-pulse'
            : 'motion-safe:animate-hibernation-sleep'
        )}
      >
        <SudarLogoMark className="h-11 w-11 text-primary" starFill="var(--card)" motion="none" />
        <SleepingFaceOverlay />
      </div>

      <FloatingZzz isWarning={isWarning} />
    </div>
  )
}
