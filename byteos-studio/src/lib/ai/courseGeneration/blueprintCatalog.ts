import type { CourseBlueprintQuestion } from './types'

/** Default preflight questionnaire — personalizable copy via /api/ai/course-blueprint. */
export const DEFAULT_COURSE_BLUEPRINT_QUESTIONS: CourseBlueprintQuestion[] = [
  {
    id: 'primary_pedagogy',
    prompt: 'What should this course optimize for?',
    options: [
      {
        id: 'declarative',
        label: 'Concepts and definitions (facts, models, vocabulary)',
        effect: { primary_pedagogy: 'declarative' },
      },
      {
        id: 'procedural',
        label: 'Procedures and how-to (steps, checklists, workflows)',
        effect: { primary_pedagogy: 'procedural' },
      },
      {
        id: 'scenario',
        label: 'Decision-making in realistic scenarios',
        effect: { primary_pedagogy: 'scenario' },
      },
      {
        id: 'mixed',
        label: 'A balanced mix',
        effect: { primary_pedagogy: 'mixed' },
      },
    ],
  },
  {
    id: 'interactivity',
    prompt: 'How much interactive practice should each lesson include?',
    options: [
      { id: 'low', label: 'Light — mostly reading, minimal interactives', effect: { interactivity_level: 'low' } },
      { id: 'balanced', label: 'Balanced — some practice in each module', effect: { interactivity_level: 'balanced' } },
      { id: 'high', label: 'High — rich practice every module', effect: { interactivity_level: 'high' } },
    ],
  },
  {
    id: 'assessment',
    prompt: 'How often should learners get knowledge checks?',
    options: [
      { id: 'light', label: 'Light — occasional checks', effect: { assessment_density: 'light' } },
      { id: 'moderate', label: 'Moderate — regular checks', effect: { assessment_density: 'moderate' } },
      { id: 'heavy', label: 'Heavy — frequent checks and practice', effect: { assessment_density: 'heavy' } },
    ],
  },
  {
    id: 'avoid_formats',
    prompt: 'Any interactive formats to de-emphasize? (Sudar will still vary lessons.)',
    options: [
      { id: 'none', label: 'No preference — full variety', effect: {} },
      {
        id: 'avoid_timeline',
        label: 'Fewer timelines (unless the topic is chronological)',
        effect: { forbidden_component_types: ['timeline'] },
      },
      {
        id: 'avoid_flipcard',
        label: 'Fewer flipcards',
        effect: { forbidden_component_types: ['flipcard'] },
      },
      {
        id: 'avoid_both',
        label: 'Fewer timelines and flipcards',
        effect: { forbidden_component_types: ['timeline', 'flipcard'] },
      },
    ],
  },
]
