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
export interface ModuleQualityRecord {
  module_id: string
  module_title: string
  quality_score: number
  issues_count: number
}

export interface GenerationTelemetry {
  completed_at: string
  archetypes_used: string[]
  component_types_used: string[]
  critique_passes: number
  quality_score?: number
  quality_issues_found?: number
  /** Average quality across modules in this run. */
  average_quality_score?: number
  module_quality?: ModuleQualityRecord[]
}

export type ThemePreference =
  | 'calora_editorial'
  | 'minimal_modern'
  | 'vibrant_interactive'
  | 'data_visualization'
  | 'dark_academic'
  | 'immersive_storytelling'

export type ContentDensity = 'concise' | 'balanced' | 'detailed'

export type CourseTypeSlug =
  | 'programming'
  | 'product_strategy'
  | 'data_science'
  | 'compliance'
  | 'soft_skills'
  | 'general'

export interface BrandColors {
  primary: string
  accent: string
  secondary?: string
}

export interface AiGenerationCourseSettings {
  target_audience?: string | null
  learning_outcomes?: string[]
  tone?: string | null
  industry?: string | null
  /** Domain for SME context and introduction variety. */
  course_type?: CourseTypeSlug | string | null
  theme_preference?: ThemePreference | null
  brand_colors?: BrandColors | null
  tone_preference?: string | null
  content_density?: ContentDensity | null
  vary_introductions?: boolean
  minimize_sidecards?: boolean
  strict_component_validation?: boolean
  apply_quality_filtering?: boolean
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
