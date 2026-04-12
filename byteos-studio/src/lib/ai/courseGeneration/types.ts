/**
 * Stored under `courses.settings.ai_generation` for pipeline context.
 * Immersive shell uses `courses.settings.experiencePack` / `experiencePackSource` separately.
 */
export interface AiGenerationCourseSettings {
  target_audience?: string | null
  learning_outcomes?: string[]
  tone?: string | null
  industry?: string | null
  /** When true, never embed external video blocks from the LLM. */
  no_external_video?: boolean
  /** Full document text for document-sourced courses (capped when stored). */
  document_text?: string | null
  source?: 'prompt' | 'document'
}

export interface CurriculumEntry {
  title: string
  bloomLevel: string
  pedagogicalRole: string
  sectionStructure: string[]
  brief: string
  buildOn: string
  archetype?: string
}

export interface CourseRowForGeneration {
  id: string
  title: string
  description: string | null
  difficulty: string | null
  settings: Record<string, unknown> | null
}

export interface ModuleRowForGeneration {
  id: string
  title: string
  content: unknown
  order_index: number
}

export interface FillEmptyModulesResult {
  completed: boolean
  modules_generated: number
  error?: string
}

export type DocumentChunkForModule = {
  moduleId: string
  excerpt: string
}
