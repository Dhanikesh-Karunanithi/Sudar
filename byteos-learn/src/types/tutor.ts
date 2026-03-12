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

export const TUTOR_BLOCK_TYPES = ['text', 'action_group', 'card', 'workflow_status', 'external_action', 'quiz'] as const
export type TutorBlockType = (typeof TUTOR_BLOCK_TYPES)[number]

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

export interface TutorQueryResponse {
  response?: string
  actions?: TutorAction[]
  blocks?: TutorBlock[]
}

export interface TutorQueryErrorResponse {
  error: string
  guardrail_refused?: boolean
}
