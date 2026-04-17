/**
 * Stored under `courses.settings.ai_generation` for pipeline context.
 * Immersive shell uses `courses.settings.experiencePack` / `experiencePackSource` separately.
 */
export type AssessmentDensity = 'light' | 'moderate' | 'heavy'
export type InteractivityLevel = 'low' | 'balanced' | 'high'
export type PrimaryPedagogy = 'declarative' | 'procedural' | 'scenario' | 'mixed'

/** Single answer from the preflight blueprint step (see /api/ai/course-blueprint). */
export interface BlueprintQuestionAnswer {
  question_id: string
  option_id: string
}

/** Effect flags applied when an option is chosen (merged into ai_generation). */
export interface CourseBlueprintOptionEffect {
  assessment_density?: AssessmentDensity
  interactivity_level?: InteractivityLevel
  primary_pedagogy?: PrimaryPedagogy
  forbidden_component_types?: string[]
}

export interface CourseBlueprintOption {
  id: string
  label: string
  effect: CourseBlueprintOptionEffect
}

export interface CourseBlueprintQuestion {
  id: string
  prompt: string
  options: CourseBlueprintOption[]
}

/** Recorded after a successful generation run for analytics and drift detection. */
export interface GenerationTelemetry {
  completed_at: string
  archetypes_used: string[]
  component_types_used: string[]
  critique_passes: number
}

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
  /** Preflight answers; optional denormalized fields below are derived when saving. */
  blueprint_answers?: BlueprintQuestionAnswer[]
  assessment_density?: AssessmentDensity
  interactivity_level?: InteractivityLevel
  primary_pedagogy?: PrimaryPedagogy
  /** Component type slugs to avoid (e.g. "timeline", "flipcard"). */
  forbidden_component_types?: string[]
  /** Written when fillEmptyModulesForCourse completes successfully. */
  generation_telemetry?: GenerationTelemetry
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
