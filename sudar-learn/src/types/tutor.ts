// Sudar tutor API response and action types (platform-aware agent)

export const TUTOR_ACTION_TYPES = ['open_course', 'open_path'] as const
export type TutorActionType = (typeof TUTOR_ACTION_TYPES)[number]

export interface TutorAction {
  type: TutorActionType
  label: string
  href: string
  course_id?: string
  path_id?: string
}

export const TUTOR_BLOCK_TYPES = [
  'text',
  'action_group',
  'card',
  'workflow_status',
  'external_action',
  'quiz',
  'choice_group',
  'concept_card',
  'diagram',
  'timeline',
  'media_card',
  'interactive_demo',
  /** Sanitized teaching HTML pinned to Tutor Journey canvas (and shown compactly in chat). */
  'lesson_html',
  /** Allowlisted YouTube embed for Journey study materials. */
  'video_embed',
  /** External https resource link card (no iframe). */
  'resource_card',
] as const
export type TutorBlockType = (typeof TUTOR_BLOCK_TYPES)[number]

/** Block types worth pinning on the Journey learning canvas (not chat-only chrome). */
export const JOURNEY_CANVAS_BLOCK_TYPES: readonly TutorBlockType[] = [
  'lesson_html',
  'concept_card',
  'diagram',
  'timeline',
  'quiz',
  'choice_group',
  'media_card',
  'interactive_demo',
  'video_embed',
  'resource_card',
] as const

export interface LessonHtmlBlockPayload {
  title?: string
  /** Short learning goal for micro-lesson chrome. */
  objective?: string
  /** Approximate minutes to complete (1–30). */
  duration_mins?: number
  /** Optional try-this prompt shown as a callout. */
  try_this?: string
  /** Allowlisted HTML — always sanitize before render. */
  html: string
}

export interface VideoEmbedBlockPayload {
  title?: string
  /** YouTube video id, or a youtube.com / youtu.be URL (sanitized to embed). */
  url?: string
  video_id?: string
  /** Why this video helps the learner. */
  why?: string
}

export interface ResourceCardBlockPayload {
  title: string
  url: string
  source_label?: string
  why?: string
}

/** Curated interactive templates — model supplies JSON params only, no arbitrary code. */
export const TUTOR_INTERACTIVE_COMPONENT_IDS = [
  'molecule_viewer',
  'cell_model',
  'physics_demo',
  'placeholder',
] as const
export type TutorInteractiveComponentId = (typeof TUTOR_INTERACTIVE_COMPONENT_IDS)[number]

export interface TutorBlock {
  id: string
  type: TutorBlockType
  payload: Record<string, unknown>
}

export interface TextBlockPayload {
  content: string
}

export interface ActionGroupBlockPayload {
  actions: TutorAction[]
}

export interface CardBlockPayload {
  title: string
  description?: string
  image_url?: string
  action?: TutorAction
}

export interface WorkflowStatusBlockPayload {
  workflow_id: string
  name: string
  steps: string[]
  current_step_index: number
  status: 'running' | 'done' | 'error'
  summary?: string
}

export interface ExternalActionBlockPayload {
  app_id: string
  label: string
  payload: Record<string, unknown>
}

export interface QuizOption {
  id: string
  text: string
  correct: boolean
  explanation: string
}

export interface QuizBlockPayload {
  question: string
  options: QuizOption[]
  topic: string
  difficulty: 'recall' | 'application' | 'challenge'
}

/** Inline clarification / tap-to-continue (same shape as proactive chips, scoped to a block). */
export interface ChoiceGroupItem {
  id: string
  label: string
  /** Server-normalized: defaults to `label` if omitted in raw JSON. */
  follow_up_message: string
}

export interface ChoiceGroupBlockPayload {
  question?: string
  choices: ChoiceGroupItem[]
  mode?: 'single'
}

export interface ConceptCardBlockPayload {
  title: string
  key_idea: string
  analogy?: string
  misconception?: string
}

export interface DiagramNode {
  id: string
  label: string
}

export interface DiagramEdge {
  from: string
  to: string
  label?: string
}

export interface DiagramBlockPayload {
  title?: string
  nodes: DiagramNode[]
  edges?: DiagramEdge[]
}

export interface TimelineItem {
  id: string
  title: string
  description?: string
}

export interface TimelineBlockPayload {
  title?: string
  items: TimelineItem[]
}

export interface MediaCardBlockPayload {
  title: string
  snippet?: string
  image_url?: string
  link_url?: string
  attribution?: string
  /** e.g. "Web result", "Image search" */
  source_label?: string
}

export interface InteractiveDemoBlockPayload {
  component_id: TutorInteractiveComponentId
  label?: string
  /** Small JSON-only params for curated components */
  params?: Record<string, unknown>
}

export interface TutorQueryResponse {
  response?: string
  /** Present when the HTTP/parse path failed but we still return a structured object. */
  error?: string
  actions?: TutorAction[]
  blocks?: TutorBlock[]
  guardrail_refused?: boolean
  guardrail_code?: string
  /** SudarNotes pedagogical turn + updated session (Journey /notes). */
  sudar_notes?: {
    turn: import('./sudarNotes').SudarNotesTurnPayload | null
    session: import('./sudarNotes').SudarNotesSessionState
  }
  routing?: {
    decision: 'local' | 'cloud'
    provider_id: string
    model: string
    fallback_used?: boolean
    fallback_reason?: string | null
  }
}

export interface TutorQueryErrorResponse {
  error: string
  guardrail_refused?: boolean
  guardrail_code?: 'sensitive_data_detected' | string
}

/** Single-select chip for proactive Sudar prompts (session, navigation, idle). */
export interface ProactivePromptChoice {
  id: string
  label: string
  /** When empty or omitted, the chip only dismisses (e.g. “Not now”). */
  follow_up_message?: string
}

export interface ProactivePromptPayload {
  message: string
  choices: ProactivePromptChoice[]
  trigger?: string
  skipped?: 'chat_config'
}
