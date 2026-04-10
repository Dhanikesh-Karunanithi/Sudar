export const MASCOT_ROLLOUT = {
  phase: 'phase1',
  surfaces: {
    dashboard: true,
    tutor_chat: true,
    lesson_inline: false,
  },
  plannedNext: ['lesson_inline', 'discipline_companion', 'wellbeing_companion'],
} as const
