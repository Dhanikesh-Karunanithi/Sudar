'use client'

import Image from 'next/image'
import { Clock, Layers } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  COURSE_ART_UIV_PICK_LAYER,
  type CourseArtMotion,
  type CourseArtPattern,
  difficultyLabel,
  formatDurationShort,
  isCourseArtUivPickId,
  resolveCourseArtTheme,
} from '@/lib/courseDefaultArt'
import { useCourseArtPattern } from '@/hooks/useCourseArtPattern'

const LOGO_SRC = '/brand/Sudar_Logo.svg'

type BaseProps = {
  courseId: string
  title: string
  difficulty: string | null
  estimatedDurationMins: number | null
  moduleCount: number | null
  /** When unset, thumbnail uses expressive; banner uses subtle. */
  motion?: CourseArtMotion
  patternOverride?: CourseArtPattern
  /** Fill a fixed-height preview box (e.g. Studio) instead of 16:9 aspect sizing. */
  embed?: boolean
  className?: string
}

function PatternLayer({
  pattern,
  motion,
  forGlass = false,
  className,
}: {
  pattern: CourseArtPattern
  motion: CourseArtMotion
  /** Second pass: sits inside frosted panels so texture survives `backdrop-blur` (base layer is blurred away). */
  forGlass?: boolean
  className?: string
}) {
  const g = forGlass

  if (isCourseArtUivPickId(pattern)) {
    const cfg = COURSE_ART_UIV_PICK_LAYER[pattern]
    return (
      <div
        className={cn(
          'pointer-events-none absolute inset-0 overflow-hidden',
          cfg.base,
          g ? cfg.glass : cfg.full,
          motion === 'expressive' ? cfg.expressive : cfg.subtle,
          className
        )}
        aria-hidden
      />
    )
  }

  if (pattern === 'mesh') {
    return (
      <div
        className={cn(
          'pointer-events-none absolute inset-0 overflow-hidden',
          g ? 'z-0 rounded-xl mix-blend-soft-light opacity-[0.48]' : 'opacity-[0.22]',
          motion === 'expressive' && 'motion-safe:sudar-art-mesh-pulse',
          className
        )}
        aria-hidden
      >
        <div className="absolute -left-1/4 top-0 h-[120%] w-1/2 rounded-full bg-cyan-400/25 blur-3xl" />
        <div className="absolute -right-1/4 bottom-0 h-[100%] w-3/5 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="absolute left-1/3 top-1/4 h-1/2 w-1/2 rounded-full bg-amber-400/10 blur-3xl" />
      </div>
    )
  }
  if (pattern === 'noise') {
    return (
      <div
        className={cn(
          'pointer-events-none absolute inset-0 sudar-art-noise',
          g ? 'z-0 rounded-xl mix-blend-overlay opacity-[0.45]' : 'opacity-[0.18] mix-blend-overlay',
          motion === 'expressive' && 'motion-safe:sudar-art-noise-shift',
          className
        )}
        aria-hidden
      />
    )
  }
  if (pattern === 'uiverse_stripes') {
    return (
      <div
        className={cn(
          'pointer-events-none absolute inset-0 sudar-art-uiverse-stripes',
          g
            ? 'z-0 rounded-xl mix-blend-overlay opacity-[0.55]'
            : 'opacity-[0.38]',
          motion === 'expressive'
            ? 'motion-safe:sudar-art-uiverse-stripes-move-expressive'
            : 'motion-safe:sudar-art-uiverse-stripes-move',
          className
        )}
        aria-hidden
      />
    )
  }
  if (pattern === 'uiverse_rings') {
    return (
      <div
        className={cn(
          'pointer-events-none absolute inset-0 sudar-art-uiverse-rings',
          g ? 'z-0 rounded-xl mix-blend-overlay opacity-[0.52]' : 'opacity-[0.4]',
          motion === 'expressive'
            ? 'motion-safe:sudar-art-uiverse-rings-pulse-expressive'
            : 'motion-safe:sudar-art-uiverse-rings-pulse',
          className
        )}
        aria-hidden
      />
    )
  }
  if (pattern === 'uiverse_hatch') {
    return (
      <div
        className={cn(
          'pointer-events-none absolute inset-0 sudar-art-uiverse-hatch',
          g ? 'z-0 rounded-xl mix-blend-overlay opacity-[0.48]' : 'opacity-[0.32]',
          motion === 'expressive' && 'motion-safe:sudar-art-uiverse-hatch-drift',
          className
        )}
        aria-hidden
      />
    )
  }
  if (pattern === 'uiverse_beams') {
    return (
      <div
        className={cn(
          'pointer-events-none absolute inset-0 sudar-art-uiverse-beams',
          g
            ? 'z-0 rounded-xl mix-blend-soft-light opacity-[0.38]'
            : 'mix-blend-soft-light opacity-[0.42]',
          motion === 'expressive'
            ? 'motion-safe:sudar-art-uiverse-beams-sweep-expressive'
            : 'motion-safe:sudar-art-uiverse-beams-sweep',
          className
        )}
        aria-hidden
      />
    )
  }
  return (
    <div
      className={cn(
        'pointer-events-none absolute inset-0 sudar-art-pattern-grid',
        g ? 'z-0 overflow-hidden rounded-xl opacity-[0.55] mix-blend-overlay' : 'opacity-[0.52]',
        motion === 'expressive' && 'motion-safe:sudar-art-grid-drift',
        className
      )}
      aria-hidden
    />
  )
}

function BackgroundOrbs({
  orbDiffClass,
  motion,
}: {
  orbDiffClass: string
  motion: CourseArtMotion
}) {
  return (
    <>
      <div
        className={cn(
          'sudar-art-orb-tint pointer-events-none absolute -right-[20%] -top-[30%] h-[85%] w-[70%] rounded-full blur-3xl motion-safe:sudar-art-orb-a',
          orbDiffClass,
          motion === 'expressive' && 'motion-safe:sudar-art-orb-a-fast'
        )}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-[35%] -left-[15%] h-[75%] w-[55%] rounded-full bg-white/[0.07] blur-3xl motion-safe:sudar-art-orb-b"
        aria-hidden
      />
    </>
  )
}

export function SudarCourseThumbnailArt({
  courseId,
  title,
  difficulty,
  estimatedDurationMins,
  moduleCount,
  motion = 'expressive',
  patternOverride,
  embed = false,
  className,
}: BaseProps) {
  const storedPattern = useCourseArtPattern()
  const pattern = patternOverride ?? storedPattern
  const theme = resolveCourseArtTheme(courseId, difficulty)
  const diff = difficultyLabel(difficulty)
  const dur = formatDurationShort(estimatedDurationMins)
  const modulesLabel =
    moduleCount != null ? `${moduleCount} module${moduleCount === 1 ? '' : 's'}` : null

  return (
    <div
      className={cn(
        'relative w-full overflow-hidden bg-muted',
        embed ? 'h-full min-h-[7rem]' : 'aspect-[16/9]',
        className
      )}
    >
      <div
        className={cn(
          theme.paletteClass,
          'absolute inset-0 sudar-art-bg-animated',
          motion === 'expressive' ? 'motion-safe:sudar-art-bg-shift-expressive' : 'motion-safe:sudar-art-bg-shift'
        )}
        aria-hidden
      />
      <BackgroundOrbs orbDiffClass={theme.orbDiffClass} motion={motion} />
      <PatternLayer pattern={pattern} motion={motion} />

      <div className="absolute inset-2 sm:inset-2.5 flex flex-col overflow-hidden rounded-xl border border-white/20 bg-white/[0.12] p-3 shadow-[0_8px_40px_rgba(0,0,0,0.25)] backdrop-blur-md sm:p-3.5">
        <PatternLayer pattern={pattern} motion={motion} forGlass />
        <div className="relative z-[1] flex min-h-0 flex-1 flex-col justify-between gap-2">
          <div className="flex justify-end">
            <div className="relative h-9 w-9 shrink-0 sm:h-10 sm:w-10" aria-hidden>
              <Image
                src={LOGO_SRC}
                alt=""
                fill
                className="object-contain object-center opacity-95 drop-shadow-md"
                sizes="40px"
                unoptimized
              />
            </div>
          </div>

          <div className="min-w-0 space-y-2">
            <p className="font-display text-[13px] font-bold leading-tight text-white drop-shadow-md line-clamp-2 sm:text-sm">
              {title}
            </p>
            <div className="flex flex-wrap items-center gap-1.5">
              {diff ? (
                <span
                  className={cn(
                    'inline-flex items-center rounded-pill border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide backdrop-blur-sm',
                    theme.difficultyPillClass
                  )}
                >
                  {diff}
                </span>
              ) : null}
              {dur ? (
                <span className="inline-flex items-center gap-1 rounded-pill border border-white/20 bg-black/15 px-2 py-0.5 text-[10px] font-medium text-white/95">
                  <Clock className="h-3 w-3 opacity-90" aria-hidden />
                  {dur}
                </span>
              ) : null}
              {modulesLabel ? (
                <span className="inline-flex items-center gap-1 rounded-pill border border-white/20 bg-black/15 px-2 py-0.5 text-[10px] font-medium text-white/95">
                  <Layers className="h-3 w-3 opacity-90" aria-hidden />
                  {modulesLabel}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function SudarCourseBannerArt({
  courseId,
  title,
  difficulty,
  estimatedDurationMins,
  moduleCount,
  motion = 'subtle',
  patternOverride,
  embed = false,
  className,
}: BaseProps) {
  const storedPattern = useCourseArtPattern()
  const pattern = patternOverride ?? storedPattern
  const theme = resolveCourseArtTheme(courseId, difficulty)
  const diff = difficultyLabel(difficulty)
  const dur = formatDurationShort(estimatedDurationMins)
  const parts = [diff, dur, moduleCount != null ? `${moduleCount} modules` : null].filter(Boolean)

  return (
    <div className={cn('relative h-full w-full overflow-hidden', embed && 'min-h-[6.5rem]', className)}>
      <div
        className={cn(
          theme.paletteClass,
          'absolute inset-0 sudar-art-bg-animated',
          motion === 'expressive' ? 'motion-safe:sudar-art-bg-shift-expressive' : 'motion-safe:sudar-art-bg-shift'
        )}
        aria-hidden
      />
      <BackgroundOrbs orbDiffClass={theme.orbDiffClass} motion={motion} />
      <PatternLayer pattern={pattern} motion={motion} />

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/55 via-black/15 to-transparent" aria-hidden />

      <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5">
        <div className="relative flex flex-col gap-3 overflow-hidden rounded-xl border border-white/15 bg-white/[0.1] px-4 py-3 backdrop-blur-md sm:flex-row sm:items-end sm:justify-between sm:gap-4">
          <PatternLayer pattern={pattern} motion={motion} forGlass />
          <div className="relative z-[1] min-w-0 flex-1 space-y-1">
            <p className="font-display text-lg font-bold leading-snug text-white drop-shadow-md line-clamp-2 sm:text-xl">
              {title}
            </p>
            {parts.length > 0 ? (
              <p className="text-xs font-medium text-white/85">
                {parts.join(' · ')}
              </p>
            ) : null}
          </div>
          <div className="relative z-[1] h-10 w-10 shrink-0 self-end sm:h-11 sm:w-11" aria-hidden>
            <Image
              src={LOGO_SRC}
              alt=""
              fill
              className="object-contain object-center opacity-95 drop-shadow-md"
              sizes="44px"
              unoptimized
            />
          </div>
        </div>
      </div>
    </div>
  )
}
