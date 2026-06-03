/** Shared AI usage metering types (Learn + Studio). */

export type AiUsageSurface = 'learn' | 'studio' | 'intelligence'

export type AiUsageUnitType =
  | 'llm_tokens'
  | 'embedding_tokens'
  | 'tts_characters'
  | 'image'
  | 'video_job'

export type AiUsageFeature =
  | 'tutor_chat'
  | 'tutor_proactive'
  | 'tutor_workflow'
  | 'next_best_action'
  | 'module_personalize'
  | 'studio_agent'
  | 'course_generation'
  | 'studio_assist'
  | 'modality_mindmap'
  | 'modality_flashcards'
  | 'modality_listen'
  | 'modality_watch'
  | 'modality_image'
  | 'rag_ingest'
  | 'rag_query'
  | 'memory_consolidation'
  | 'intelligence_other'

export type AiUsageCallKind =
  | 'main'
  | 'guardrail'
  | 'quiz'
  | 'memory_extract'
  | 'blueprint'
  | 'outline'
  | 'module_fill'
  | 'critique'
  | 'embed'
  | 'rerank'
  | 'tts'
  | 'image'
  | 'video_job'
  | 'other'

export type ChatUsage = {
  prompt_tokens: number
  completion_tokens: number
  cached_tokens?: number
  total_tokens: number
}

export type AiUsageMetadata = {
  course_id?: string
  module_id?: string
  job_id?: string
  latency_ms?: number
  private_runtime?: boolean
  art_method?: 'aipencil' | 'llm-css' | 'flux'
  art_model?: string
  error?: string
}

export type AiUsageContext = {
  orgId: string
  userId?: string | null
  surface: AiUsageSurface
  feature: AiUsageFeature
  callKind?: AiUsageCallKind
  route?: string
  metadata?: AiUsageMetadata
}
