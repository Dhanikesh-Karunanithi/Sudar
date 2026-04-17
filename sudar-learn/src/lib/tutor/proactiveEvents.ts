/** Dispatched when learner picks a proactive chip with a tutor follow-up (opens floating chat). */
export const PROACTIVE_FOLLOW_UP_EVENT = 'sudar-proactive-follow-up'

export type ProactiveFollowUpDetail = {
  message: string
  trigger?: string
}
