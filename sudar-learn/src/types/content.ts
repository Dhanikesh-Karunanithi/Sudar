/**
 * Sudar — Rich module content and modality variant types
 * Used by Learn for rendering; Studio uses the same shapes when writing content Json.
 */

/** Lesson structural archetype (content variability engine). */
export const LESSON_ARCHETYPES = [
  'cold-open',
  'socratic',
  'misconception-trap',
  'case-file',
  'comparison-engine',
] as const
export type LessonArchetype = (typeof LESSON_ARCHETYPES)[number]

/** Entry state types for lesson openers. */
export const ENTRY_STATE_TYPES = ['provocation', 'data-drop', 'scenario-fragment', 'contrarian-claim'] as const
export type EntryStateType = (typeof ENTRY_STATE_TYPES)[number]

/** Exit state types for lesson closers. */
export const EXIT_STATE_TYPES = ['reflection', 'apply-24h', 'next-conflict-teaser', 'what-changed'] as const
export type ExitStateType = (typeof EXIT_STATE_TYPES)[number]

export interface EntryState {
  type: EntryStateType
  content: string
}

export interface ExitState {
  type: ExitStateType
  content: string
}

/** Side note voice types for dynamic side cards. */
export const SIDE_NOTE_TYPES = ['wait-but-why', 'real-world', 'brain-moment', 'expert-voice', 'rabbit-hole'] as const
export type SideNoteType = (typeof SIDE_NOTE_TYPES)[number]

/** Quiz mode for richer assessment variety. */
export const QUIZ_MODES = ['standard', 'predict-then-learn', 'confidence-tagged', 'scenario-fork', 'peer-contrast'] as const
export type QuizMode = (typeof QUIZ_MODES)[number]

/** Legacy module content (unchanged) */
export interface TextContent {
  type: 'text'
  body: string
}

/** Image alignment in the layout (Studio + Learn). */
export type ImageAlignment = 'left' | 'center' | 'right' | 'full'
/** Image size preset (Studio + Learn). */
export type ImageSize = 'small' | 'medium' | 'large' | 'full'

/** Section within rich content */
export interface RichContentSection {
  heading: string
  content: string
  type?: 'text' | 'list' | 'code' | 'diagram'
  items?: string[]
  image?: { url: string; alt?: string; attribution?: string; alignment?: ImageAlignment; size?: ImageSize }
  /** Stable block ID for editor roundtrip (Studio). */
  _blockId?: string
  /** True when this section is a standalone text block (not mainText) (Studio). */
  _isBlock?: boolean
}

/** Interactive element in rich content */
export interface RichInteractiveElement {
  type: 'quiz' | 'expandable' | 'code-demo' | 'diagram' | 'video' | 'audio' | 'flashcard' | 'timeline' | 'flipcard' | 'hotspot' | 'matching' | 'tabs'
  data: Record<string, unknown>
  /** For quiz elements: standard | predict-then-learn | confidence-tagged | scenario-fork | peer-contrast */
  quizMode?: QuizMode
  /** Stable block ID for editor roundtrip (Studio). */
  _blockId?: string
}

/** Side card in rich content */
export interface RichSideCard {
  title: string
  content: string
  tips?: string[]
  noteType?: SideNoteType
}

/** Rich module content (new) */
export interface RichContent {
  type: 'rich'
  archetype?: LessonArchetype
  /** Replaces generic introduction when present. */
  entryState?: EntryState
  /** Replaces generic summary when present. */
  exitState?: ExitState
  introduction?: string
  sections: RichContentSection[]
  summary?: string
  interactiveElements?: RichInteractiveElement[]
  sideCard?: RichSideCard
}

/** SCORM 1.2 hosted module — rendered via iframe with API shim */
export interface ScormContent {
  type: 'scorm'
  launch_url: string
  package_base?: string
  scorm_version?: '1.2' | '2004'
  /** Extracted plain-text from the SCO HTML files — used as Sudar's knowledge base for this module */
  scorm_text_content?: string
}

export function isScormContent(content: unknown): content is ScormContent {
  return typeof content === 'object' && content !== null && (content as ScormContent).type === 'scorm'
}

/** Module content: either legacy text, rich, or SCORM iframe */
export type ModuleContent = TextContent | RichContent | ScormContent

/** Type guard for rich content */
export function isRichContent(content: unknown): content is RichContent {
  return (
    typeof content === 'object' &&
    content !== null &&
    (content as RichContent).type === 'rich' &&
    Array.isArray((content as RichContent).sections)
  )
}

/** Video scene for modality variant */
export interface VideoScene {
  sceneNumber: number
  title: string
  narration: string
  visuals?: string
  duration?: number
  /** Base64 data URL for TTS audio (optional). */
  audioDataURL?: string
}

/** Podcast dialogue segment */
export interface DialogueSegment {
  speaker: 'host' | 'expert'
  text: string
  /** Base64 data URL for TTS audio (optional). */
  audioDataURL?: string
}

/** Modality variants stored on module (or course) */
export interface ModalityVariants {
  video?: { scenes: VideoScene[] }
  podcast?: { dialogue: DialogueSegment[] }
}
