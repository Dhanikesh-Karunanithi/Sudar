/** Aggregates learning_events into learner_profiles twin fields (modality affinity, engagement). */

import type { ContentIntent } from '@/lib/learner/modalityContentIntent'

export const CANONICAL_MODALITY_KEYS = [
  'text',
  'video',
  'audio',
  'mindmap',
  'flashcards',
  'game',
  'feed',
  'sudarsim',
] as const

export type CanonicalModality = (typeof CANONICAL_MODALITY_KEYS)[number]

const DEFAULT_SCORES: Record<CanonicalModality, number> = {
  text: 0.5,
  video: 0.5,
  audio: 0.5,
  mindmap: 0.5,
  flashcards: 0.5,
  game: 0.5,
  feed: 0.5,
  sudarsim: 0.5,
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n))
}

/** Map Learn UI modalities into twin score buckets. */
export function canonicalModality(raw: string | null | undefined): CanonicalModality {
  const m = (raw ?? 'text').toLowerCase()
  if (m === 'listening' || m === 'podcast') return 'audio'
  if (m === 'reading') return 'text'
  if ((CANONICAL_MODALITY_KEYS as readonly string[]).includes(m)) return m as CanonicalModality
  return 'text'
}

function toLocalDateKey(d: Date): string {
  const y = d.getFullYear()
  const mo = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${mo}-${day}`
}

function parseLocalDateKey(key: string): Date {
  const [y, mo, day] = key.split('-').map((x) => Number(x))
  return new Date(y, (mo ?? 1) - 1, day ?? 1, 0, 0, 0, 0)
}

/** Streak from local calendar day keys (aligned with dashboard). */
export function computeStreakDayKeys(dayKeys: string[]): number {
  if (!dayKeys.length) return 0
  const uniqueSorted = [...new Set(dayKeys)].sort()
  const todayKey = toLocalDateKey(new Date())
  const yesterdayKey = toLocalDateKey(new Date(Date.now() - 86400000))
  const lastKey = uniqueSorted[uniqueSorted.length - 1]
  if (lastKey !== todayKey && lastKey !== yesterdayKey) return 0

  let streak = 1
  for (let i = uniqueSorted.length - 2; i >= 0; i--) {
    const curr = parseLocalDateKey(uniqueSorted[i])
    const next = parseLocalDateKey(uniqueSorted[i + 1])
    const diffDays = Math.round((next.getTime() - curr.getTime()) / 86400000)
    if (diffDays === 1) streak++
    else break
  }
  return streak
}

export interface LearningEventRow {
  event_type: string
  modality: string | null
  duration_secs: number | null
  payload?: Record<string, unknown> | null
  created_at: string
}

export interface TwinRollupResult {
  modality_scores: Record<CanonicalModality, number>
  avg_session_duration_mins: number
  total_learning_minutes: number
  streak_days: number
  overall_engagement_score: number
  avg_completion_rate: number
  last_active_at: string
}

export function computeTwinRollup(
  events: LearningEventRow[],
  existingScores: Record<string, number> | null | undefined
): TwinRollupResult {
  const timeByModality = {} as Record<CanonicalModality, number>
  for (const k of CANONICAL_MODALITY_KEYS) timeByModality[k] = 0

  const sessionDurations: number[] = []
  let moduleCompletes = 0
  let moduleStarts = 0
  let trackedActiveSecs = 0
  let trackedTotalSecs = 0
  let inactivityTransitions = 0

  for (const ev of events) {
    const bucket = canonicalModality(ev.modality)
    const ds = clamp(ev.duration_secs ?? 0, 0, 7200)
    const payload = (ev.payload ?? {}) as Record<string, unknown>
    const payloadActiveSecs =
      typeof payload.active_secs === 'number' && Number.isFinite(payload.active_secs)
        ? Math.max(0, payload.active_secs)
        : null
    const payloadTotalSecs =
      typeof payload.total_secs === 'number' && Number.isFinite(payload.total_secs)
        ? Math.max(0, payload.total_secs)
        : null

    switch (ev.event_type) {
      case 'section_heartbeat':
      case 'module_complete':
        if (ds > 0) timeByModality[bucket] += ds
        break
      case 'session_end':
        if (ds > 0) {
          sessionDurations.push(ds)
          timeByModality[bucket] += Math.min(ds, 3600)
        }
        break
      case 'video_play':
      case 'video_pause':
      case 'read_along_start':
      case 'read_along_complete':
        if (ds > 0) timeByModality[bucket] += ds
        break
      case 'quiz_attempt':
        timeByModality[bucket] += Math.max(ds, 45)
        break
      case 'modality_switch':
        timeByModality[bucket] += 20
        break
      case 'inactivity_warning_started':
      case 'inactivity_hibernated':
      case 'inactivity_resumed':
        inactivityTransitions += 1
        break
      default:
        break
    }

    if (payloadActiveSecs !== null) trackedActiveSecs += payloadActiveSecs
    if (payloadTotalSecs !== null) trackedTotalSecs += payloadTotalSecs

    if (ev.event_type === 'module_complete') moduleCompletes++
    if (ev.event_type === 'module_start') moduleStarts++
  }

  const totalTime = CANONICAL_MODALITY_KEYS.reduce((s, k) => s + timeByModality[k], 0)

  const prev: Record<CanonicalModality, number> = { ...DEFAULT_SCORES }
  for (const k of CANONICAL_MODALITY_KEYS) {
    const v = existingScores?.[k]
    prev[k] = typeof v === 'number' && !Number.isNaN(v) ? clamp(v, 0.08, 0.98) : DEFAULT_SCORES[k]
  }

  const nextScores: Record<CanonicalModality, number> = { ...prev }
  if (totalTime > 120) {
    for (const k of CANONICAL_MODALITY_KEYS) {
      const share = timeByModality[k] / totalTime
      const target = clamp(0.32 + share * 0.62, 0.18, 0.94)
      nextScores[k] = clamp(prev[k] * 0.35 + target * 0.65, 0.12, 0.96)
    }
  }

  const dayKeys = events.map((e) => toLocalDateKey(new Date(e.created_at)))
  const streak = computeStreakDayKeys(dayKeys)

  const avgSessionMins = sessionDurations.length
    ? sessionDurations.reduce((a, b) => a + b, 0) / sessionDurations.length / 60
    : clamp(totalTime / Math.max(8, moduleStarts || 1) / 60, 0, 180)

  const completionRatio =
    moduleStarts > 0 ? clamp(moduleCompletes / moduleStarts, 0, 1) : moduleCompletes > 0 ? 0.65 : 0.45

  const activeIntegrity =
    trackedTotalSecs > 0 ? clamp(trackedActiveSecs / trackedTotalSecs, 0, 1) : 1
  const inactivityPenalty = clamp(inactivityTransitions / Math.max(12, events.length), 0, 0.12)

  const overallEngagement = clamp(
    (avgSessionMins / 50) * 0.35 +
      completionRatio * 0.32 +
      Math.min(streak, 21) / 21 * 0.18 +
      activeIntegrity * 0.15 -
      inactivityPenalty,
    0.06,
    0.98
  )

  return {
    modality_scores: nextScores,
    avg_session_duration_mins: Math.round(avgSessionMins * 10) / 10,
    total_learning_minutes: Math.round((totalTime / 60) * 10) / 10,
    streak_days: streak,
    overall_engagement_score: Math.round(overallEngagement * 1000) / 1000,
    avg_completion_rate: Math.round(completionRatio * 1000) / 1000,
    last_active_at: new Date().toISOString(),
  }
}

const INTENT_KEYS: ContentIntent[] = ['conceptual', 'procedural', 'review', 'assessment']

export type ModalityContextMatrix = Record<
  ContentIntent,
  Partial<Record<CanonicalModality, number>>
>

function emptyMatrix(): ModalityContextMatrix {
  return {
    conceptual: {},
    procedural: {},
    review: {},
    assessment: {},
  }
}

/**
 * Update 2D modality×intent affinity from modality_switch events (requires payload.content_intent).
 */
export function computeModalityContextMatrix(
  events: LearningEventRow[],
  existing: ModalityContextMatrix | null | undefined,
): ModalityContextMatrix {
  const matrix = existing ? (JSON.parse(JSON.stringify(existing)) as ModalityContextMatrix) : emptyMatrix()

  for (const ev of events) {
    if (ev.event_type !== 'modality_switch') continue
    const payload = (ev.payload ?? {}) as Record<string, unknown>
    const intent = (payload.content_intent as ContentIntent) ?? 'conceptual'
    if (!INTENT_KEYS.includes(intent)) continue
    const bucket = canonicalModality(ev.modality)
    const row = { ...(matrix[intent] ?? {}) }
    const prev = typeof row[bucket] === 'number' ? (row[bucket] as number) : 0.5
    row[bucket] = clamp(prev * 0.85 + 0.15, 0.12, 0.98)
    matrix[intent] = row
  }

  return matrix
}
