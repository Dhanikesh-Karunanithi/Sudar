import type { NotificationCategorySlug } from './categories'
import { isWithinQuietHours } from './quietHours'

export type SoundEventGroup = 'task_complete' | 'sudar_reply' | 'notification' | 'celebration'

export interface NotificationSoundPrefs {
  sound_enabled: boolean
  sound_volume: number
  sound_task_complete: boolean
  sound_sudar_reply: boolean
  sound_notifications: boolean
  sound_celebration: boolean
  timezone?: string | null
  quiet_hours_start?: string | null
  quiet_hours_end?: string | null
}

export const DEFAULT_NOTIFICATION_SOUND_PREFS: NotificationSoundPrefs = {
  sound_enabled: false,
  sound_volume: 50,
  sound_task_complete: true,
  sound_sudar_reply: true,
  sound_notifications: true,
  sound_celebration: true,
  timezone: 'UTC',
  quiet_hours_start: null,
  quiet_hours_end: null,
}

const SOUND_FILES: Record<SoundEventGroup, string> = {
  task_complete: 'task-complete.wav',
  sudar_reply: 'reply.wav',
  notification: 'notify.wav',
  celebration: 'celebration.wav',
}

/** Max gain after user volume slider (keeps chimes office-friendly). */
const VOLUME_CAP = 0.25

const DEBOUNCE_MS = 2500

const lastPlayedAt: Partial<Record<SoundEventGroup, number>> = {}

let audioUnlocked = false
const audioCache = new Map<SoundEventGroup, HTMLAudioElement>()

export function categoryToSoundGroup(category: string | null | undefined): SoundEventGroup {
  switch (category) {
    case 'course_generated':
      return 'task_complete'
    case 'tutor_proactive':
      return 'sudar_reply'
    case 'achievement':
    case 'level_up':
    case 'coin_drop':
      return 'celebration'
    default:
      return 'notification'
  }
}

export function mapCategorySlug(category: NotificationCategorySlug | string): SoundEventGroup {
  return categoryToSoundGroup(category)
}

function groupEnabled(prefs: NotificationSoundPrefs, group: SoundEventGroup): boolean {
  switch (group) {
    case 'task_complete':
      return prefs.sound_task_complete
    case 'sudar_reply':
      return prefs.sound_sudar_reply
    case 'notification':
      return prefs.sound_notifications
    case 'celebration':
      return prefs.sound_celebration
    default:
      return true
  }
}

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function shouldPlaySound(
  prefs: NotificationSoundPrefs,
  group: SoundEventGroup,
  now: Date = new Date(),
  options?: { skipDebounce?: boolean; ignoreQuietHours?: boolean }
): boolean {
  if (typeof window === 'undefined') return false
  if (!prefs.sound_enabled) return false
  if (!groupEnabled(prefs, group)) return false
  if (prefersReducedMotion()) return false
  if (
    !options?.ignoreQuietHours &&
    isWithinQuietHours(
      now,
      prefs.timezone ?? 'UTC',
      prefs.quiet_hours_start ?? null,
      prefs.quiet_hours_end ?? null
    )
  ) {
    return false
  }
  if (!options?.skipDebounce) {
    const last = lastPlayedAt[group]
    if (last != null && now.getTime() - last < DEBOUNCE_MS) return false
  }
  return true
}

function resolveBasePath(basePath?: string): string {
  if (basePath) return basePath.replace(/\/?$/, '/')
  if (typeof window !== 'undefined') return '/audio/notifications/'
  return '/audio/notifications/'
}

function getAudioElement(group: SoundEventGroup, basePath?: string): HTMLAudioElement | null {
  if (typeof window === 'undefined') return null
  const cached = audioCache.get(group)
  if (cached) return cached
  const el = new Audio(`${resolveBasePath(basePath)}${SOUND_FILES[group]}`)
  el.preload = 'auto'
  audioCache.set(group, el)
  return el
}

/** Call once after first user gesture so autoplay policies allow chimes. */
export function unlockNotificationAudio(): void {
  if (typeof window === 'undefined' || audioUnlocked) return
  audioUnlocked = true
  for (const group of Object.keys(SOUND_FILES) as SoundEventGroup[]) {
    const el = getAudioElement(group)
    if (!el) continue
    el.volume = 0.001
    const p = el.play()
    if (p && typeof p.then === 'function') {
      void p.then(() => {
        el.pause()
        el.currentTime = 0
      }).catch(() => {
        /* ignore — will unlock on next interaction */
      })
    }
  }
}

export interface PlaySudarChimeOptions {
  group: SoundEventGroup
  prefs: NotificationSoundPrefs
  basePath?: string
  skipDebounce?: boolean
  ignoreQuietHours?: boolean
}

export function playSudarChime(options: PlaySudarChimeOptions): void {
  const { group, prefs, basePath, skipDebounce, ignoreQuietHours } = options
  const now = new Date()
  if (!shouldPlaySound(prefs, group, now, { skipDebounce, ignoreQuietHours })) return

  const el = getAudioElement(group, basePath)
  if (!el) return

  const userVol = Math.max(0, Math.min(100, prefs.sound_volume ?? 50)) / 100
  el.volume = userVol * VOLUME_CAP
  el.currentTime = 0

  const playPromise = el.play()
  lastPlayedAt[group] = now.getTime()

  if (playPromise && typeof playPromise.catch === 'function') {
    void playPromise.catch(() => {
      /* silent — autoplay blocked until unlockNotificationAudio */
    })
  }
}

export function parseSoundPrefsFromSettings(
  settings: Record<string, unknown> | null | undefined
): NotificationSoundPrefs {
  if (!settings) return { ...DEFAULT_NOTIFICATION_SOUND_PREFS }
  return {
    sound_enabled: Boolean(settings.sound_enabled),
    sound_volume:
      typeof settings.sound_volume === 'number'
        ? Math.max(0, Math.min(100, settings.sound_volume))
        : DEFAULT_NOTIFICATION_SOUND_PREFS.sound_volume,
    sound_task_complete:
      settings.sound_task_complete !== undefined
        ? Boolean(settings.sound_task_complete)
        : true,
    sound_sudar_reply:
      settings.sound_sudar_reply !== undefined ? Boolean(settings.sound_sudar_reply) : true,
    sound_notifications:
      settings.sound_notifications !== undefined ? Boolean(settings.sound_notifications) : true,
    sound_celebration:
      settings.sound_celebration !== undefined ? Boolean(settings.sound_celebration) : true,
    timezone: (settings.timezone as string | null) ?? 'UTC',
    quiet_hours_start: (settings.quiet_hours_start as string | null) ?? null,
    quiet_hours_end: (settings.quiet_hours_end as string | null) ?? null,
  }
}
