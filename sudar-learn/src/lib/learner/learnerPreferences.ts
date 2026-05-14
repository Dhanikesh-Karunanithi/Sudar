import type { SupabaseClient } from '@supabase/supabase-js'
import type { Json } from '@/types/database'
import { DEFAULT_APP_LOCALE, isAppLocale, type AppLocale } from '../../../../shared/i18nLocales'
import {
  clampMemoryDigestCadenceDays,
  clampTutorMemoryLlmCadence,
  type MemoryDigestCadenceDays,
  type TutorMemoryLlmCadence,
} from '@/lib/learner/tutorMemoryCadence'

/** Default tutor explanation style when not specified. */
export type TutorPedagogyMode = 'explain' | 'guide' | 'exam_focus'
export type SudarPetMode = 'off' | 'follow' | 'float' | 'corner'
export type SudarPetCorner = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'

/**
 * Partial learner-controlled flags. Stored in `learner_profiles.learner_preferences`.
 * `null` column means use LEGACY_DEFAULTS (matches pre-shipment behaviour).
 */
export type LearnerPreferencesInput = {
  tutor_pedagogy_default?: TutorPedagogyMode
  /** Master switch: when false, idle + route + session proactive prompts are off. */
  proactive_nudges_enabled?: boolean
  idle_nudges?: boolean
  route_prompts?: boolean
  session_start_prompts?: boolean
  module_bridge_prompts?: boolean
  supplemental_practice_offers?: boolean
  /** Include consolidated long-range interaction digest in tutor context. */
  memory_digest_enabled?: boolean
  /**
   * How often an LLM may infer profile updates (concepts/struggles/style) from a tutor exchange.
   * Org may apply a minimum spacing floor or disable entirely.
   */
  tutor_memory_llm_cadence?: TutorMemoryLlmCadence
  /** Minimum full days between digest LLM runs when long-range summary is enabled. */
  memory_digest_cadence_days?: MemoryDigestCadenceDays
  /** Learn 2D modality × intent matrix from behaviour (opt-in). */
  infer_modality_matrix?: boolean
  /** Use inferred struggle signals inside tutor prompts. */
  stuck_detection_tutor?: boolean
  /** Allow proactive messages when likely stuck (idle nudge, etc.). */
  stuck_detection_nudges?: boolean
  /** Opt-in toggle for viewport Sudar pet. */
  sudar_pet_enabled?: boolean
  /** Active pet movement behavior. */
  sudar_pet_mode?: SudarPetMode
  /** Preferred resting corner when mode is `corner`. */
  sudar_pet_corner?: SudarPetCorner
  /** BCP-47 UI locale for Sudar Learn chrome (next-intl). */
  ui_language?: AppLocale
  /** Language Sudar should use in chat, nudges, and explanations. */
  content_language?: AppLocale
  /** When true, tutor may follow the learner's message language when clear. */
  auto_detect_language?: boolean
}

export type ResolvedLearnerPreferences = {
  tutor_pedagogy_default: TutorPedagogyMode
  proactive_nudges_enabled: boolean
  idle_nudges: boolean
  route_prompts: boolean
  session_start_prompts: boolean
  module_bridge_prompts: boolean
  supplemental_practice_offers: boolean
  memory_digest_enabled: boolean
  tutor_memory_llm_cadence: TutorMemoryLlmCadence
  memory_digest_cadence_days: MemoryDigestCadenceDays
  infer_modality_matrix: boolean
  stuck_detection_tutor: boolean
  stuck_detection_nudges: boolean
  sudar_pet_enabled: boolean
  sudar_pet_mode: SudarPetMode
  sudar_pet_corner: SudarPetCorner
  ui_language: AppLocale
  content_language: AppLocale
  auto_detect_language: boolean
}

/** When `learner_preferences` is NULL — same behaviour as shipped before toggles existed. */
export const LEGACY_DEFAULTS: ResolvedLearnerPreferences = {
  tutor_pedagogy_default: 'explain',
  proactive_nudges_enabled: true,
  idle_nudges: true,
  route_prompts: true,
  session_start_prompts: true,
  module_bridge_prompts: true,
  supplemental_practice_offers: true,
  memory_digest_enabled: true,
  tutor_memory_llm_cadence: 'every_message',
  memory_digest_cadence_days: 1,
  infer_modality_matrix: false,
  stuck_detection_tutor: true,
  stuck_detection_nudges: true,
  sudar_pet_enabled: false,
  sudar_pet_mode: 'off',
  sudar_pet_corner: 'bottom-right',
  ui_language: DEFAULT_APP_LOCALE,
  content_language: DEFAULT_APP_LOCALE,
  auto_detect_language: false,
}

function clampPedagogy(m: unknown): TutorPedagogyMode {
  if (m === 'guide' || m === 'exam_focus' || m === 'explain') return m
  return 'explain'
}

function clampPetMode(mode: unknown): SudarPetMode {
  if (mode === 'off' || mode === 'follow' || mode === 'float' || mode === 'corner') return mode
  return 'off'
}

function clampPetCorner(corner: unknown): SudarPetCorner {
  if (corner === 'bottom-right' || corner === 'bottom-left' || corner === 'top-right' || corner === 'top-left') return corner
  return 'bottom-right'
}

function clampAppLocaleField(value: unknown, fallback: AppLocale): AppLocale {
  if (typeof value === 'string' && isAppLocale(value)) return value
  return fallback
}

export function parseLearnerPreferencesJson(raw: Json | null | undefined): Partial<LearnerPreferencesInput> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
  return raw as Partial<LearnerPreferencesInput>
}

export function resolveLearnerPreferences(
  stored: Json | null | undefined,
): ResolvedLearnerPreferences {
  if (stored === null || stored === undefined) {
    return { ...LEGACY_DEFAULTS }
  }
  const p = parseLearnerPreferencesJson(stored)
  return {
    tutor_pedagogy_default: clampPedagogy(p.tutor_pedagogy_default ?? LEGACY_DEFAULTS.tutor_pedagogy_default),
    proactive_nudges_enabled: p.proactive_nudges_enabled ?? LEGACY_DEFAULTS.proactive_nudges_enabled,
    idle_nudges: p.idle_nudges ?? LEGACY_DEFAULTS.idle_nudges,
    route_prompts: p.route_prompts ?? LEGACY_DEFAULTS.route_prompts,
    session_start_prompts: p.session_start_prompts ?? LEGACY_DEFAULTS.session_start_prompts,
    module_bridge_prompts: p.module_bridge_prompts ?? LEGACY_DEFAULTS.module_bridge_prompts,
    supplemental_practice_offers: p.supplemental_practice_offers ?? LEGACY_DEFAULTS.supplemental_practice_offers,
    memory_digest_enabled: p.memory_digest_enabled ?? LEGACY_DEFAULTS.memory_digest_enabled,
    tutor_memory_llm_cadence: clampTutorMemoryLlmCadence(
      p.tutor_memory_llm_cadence ?? LEGACY_DEFAULTS.tutor_memory_llm_cadence,
    ),
    memory_digest_cadence_days: clampMemoryDigestCadenceDays(
      p.memory_digest_cadence_days ?? LEGACY_DEFAULTS.memory_digest_cadence_days,
    ),
    infer_modality_matrix: p.infer_modality_matrix ?? LEGACY_DEFAULTS.infer_modality_matrix,
    stuck_detection_tutor: p.stuck_detection_tutor ?? LEGACY_DEFAULTS.stuck_detection_tutor,
    stuck_detection_nudges: p.stuck_detection_nudges ?? LEGACY_DEFAULTS.stuck_detection_nudges,
    sudar_pet_enabled: p.sudar_pet_enabled ?? LEGACY_DEFAULTS.sudar_pet_enabled,
    sudar_pet_mode: clampPetMode(p.sudar_pet_mode ?? LEGACY_DEFAULTS.sudar_pet_mode),
    sudar_pet_corner: clampPetCorner(p.sudar_pet_corner ?? LEGACY_DEFAULTS.sudar_pet_corner),
    ui_language: clampAppLocaleField(p.ui_language, LEGACY_DEFAULTS.ui_language),
    content_language: clampAppLocaleField(p.content_language, LEGACY_DEFAULTS.content_language),
    auto_detect_language: p.auto_detect_language ?? LEGACY_DEFAULTS.auto_detect_language,
  }
}

/** Effective pedagogy for one request: explicit override wins, then stored default. */
export function effectivePedagogy(
  prefs: ResolvedLearnerPreferences,
  requestOverride: TutorPedagogyMode | undefined,
): TutorPedagogyMode {
  if (requestOverride && (requestOverride === 'guide' || requestOverride === 'exam_focus' || requestOverride === 'explain')) {
    return requestOverride
  }
  return prefs.tutor_pedagogy_default
}

export async function fetchResolvedLearnerPreferences(
  admin: SupabaseClient,
  userId: string,
): Promise<ResolvedLearnerPreferences> {
  const { data } = await admin
    .from('learner_profiles')
    .select('learner_preferences')
    .eq('user_id', userId)
    .maybeSingle()
  return resolveLearnerPreferences(data?.learner_preferences ?? null)
}
