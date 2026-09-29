/** Dispatched when learner picks a proactive chip with a tutor follow-up (opens floating chat). */
export const PROACTIVE_FOLLOW_UP_EVENT = 'sudar-proactive-follow-up'

export type ProactiveFollowUpDetail = {
  message: string
  trigger?: string
}

/** Open / focus existing Floating Sudar chat (optionally seed a message). */
export const OPEN_TUTOR_EVENT = 'sudar-open-tutor'

export type OpenTutorDetail = {
  /** If set, send this message after opening. */
  message?: string
  /** Open the panel without sending. */
  openOnly?: boolean
  /** Prefill the composer without sending (e.g. notebook custom ask). */
  draftInput?: string
  pedagogy_mode?: 'explain' | 'guide' | 'exam_focus'
  trigger?: string
}

/** Tutor Journey canvas: pin rich teaching artifacts from Sudar replies. */
export const JOURNEY_ARTIFACTS_EVENT = 'sudar-journey-artifacts'

export type JourneyArtifactsDetail = {
  blocks: import('@/types/tutor').TutorBlock[]
  responsePreview?: string
  trigger?: string
}
