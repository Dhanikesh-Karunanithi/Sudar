/**
 * Default pedagogy/policy constants for Learn-side cron hooks.
 * Mirrors `sudar-intelligence/src/agents/policies/default.yaml`.
 */
export const DEFAULT_AGENT_POLICY_PACK_ID = 'default'

export const defaultSpacingCronConfig = () => ({
  minGapDaysBetweenNudges: 2,
  maxNotificationsPerRun: 50,
  quizAttemptsThreshold: 2,
})
