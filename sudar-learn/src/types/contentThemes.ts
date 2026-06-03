/**
 * Sudar Learn — Content Theme Types
 * Premium visual themes for course rendering with enhanced pedagogical components
 */

export type ThemeSlug = 
  | 'calora_editorial'
  | 'minimal_modern'
  | 'vibrant_interactive'
  | 'data_visualization'
  | 'dark_academic'
  | 'immersive_storytelling'

export interface ThemeConfig {
  slug: ThemeSlug
  label: string
  description: string
  primaryColor: string
  accentColor: string
  backgroundColor: string
  fontFamily: string
  headerStyle: 'gradient' | 'minimal' | 'immersive'
  bestFor: string[]
}

/**
 * Enhanced RichContent Component Types
 * Beyond basic text + image, support pedagogically-rich structures
 */

export type PedagogicalComponentType =
  | 'case_study'
  | 'framework_grid'
  | 'highlight_box'
  | 'key_takeaways'
  | 'expert_voice'
  | 'scenario_challenge'
  | 'real_world_example'

export interface CaseStudy {
  type: 'case_study'
  title: string
  company?: string
  industry?: string
  challenge: string
  solution: string
  outcome: string
  keyLearning: string
  icon?: string
}

export interface FrameworkGrid {
  type: 'framework_grid'
  title: string
  description?: string
  columns: 2 | 3 | 4
  items: FrameworkItem[]
}

export interface FrameworkItem {
  title: string
  description: string
  icon?: string
}

export interface HighlightBox {
  type: 'highlight_box'
  heading: string
  content: string
  emphasis?: 'warning' | 'success' | 'info' | 'critical'
}

export interface KeyTakeaways {
  type: 'key_takeaways'
  title?: string
  items: string[]
}

export interface ExpertVoice {
  type: 'expert_voice'
  quote: string
  attribution: string
  role?: string
  image?: string
}

export interface ScenarioChallenge {
  type: 'scenario_challenge'
  scenario: string
  question: string
  options: ScenarioOption[]
  correctOptionId: string
}

export interface ScenarioOption {
  id: string
  text: string
  feedback?: string
}

export interface RealWorldExample {
  type: 'real_world_example'
  title: string
  context: string
  details: string
  why_matters: string
  source?: string
}

/**
 * Content Quality Metrics
 * Track pedagogical rigor and engagement
 */

export interface ContentQualityScore {
  overall: number // 1-10
  clarity: number
  relevance: number
  engagement: number
  scaffolding: number
  issues: QualityIssue[]
}

export interface QualityIssue {
  type: 'vague_explanation' | 'outdated_example' | 'missing_context' | 'poor_scaffolding' | 'weak_assessment'
  severity: 'critical' | 'warning' | 'info'
  description: string
  suggestion?: string
}

/**
 * Theme-Course Alignment
 * Recommended theme for each course type
 */

export const THEME_RECOMMENDATIONS = {
  'technical_programming': 'minimal_modern',
  'executive_leadership': 'immersive_storytelling',
  'compliance_training': 'calora_editorial',
  'data_science': 'data_visualization',
  'soft_skills': 'vibrant_interactive',
  'advanced_engineering': 'dark_academic',
  'microlearning': 'vibrant_interactive',
  'certification': 'calora_editorial',
}

export type CourseType = keyof typeof THEME_RECOMMENDATIONS
