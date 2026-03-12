/**
 * ByteOS — Rich module content types (Studio)
 * Used when generating and writing module content Json; matches Learn content.ts.
 */

/** Lesson structural archetype. */
export type LessonArchetype = 'cold-open' | 'socratic' | 'misconception-trap' | 'case-file' | 'comparison-engine'

/** Entry state types for lesson openers. */
export type EntryStateType = 'provocation' | 'data-drop' | 'scenario-fragment' | 'contrarian-claim'

/** Exit state types for lesson closers. */
export type ExitStateType = 'reflection' | 'apply-24h' | 'next-conflict-teaser' | 'what-changed'

export interface EntryState {
  type: EntryStateType
  content: string
}

export interface ExitState {
  type: ExitStateType
  content: string
}

/** Side note voice types. */
export type SideNoteType = 'wait-but-why' | 'real-world' | 'brain-moment' | 'expert-voice' | 'rabbit-hole'

/** Quiz mode for quiz elements. */
export type QuizMode = 'standard' | 'predict-then-learn' | 'confidence-tagged' | 'scenario-fork' | 'peer-contrast'

export interface TextContent {
  type: 'text'
  body: string
}

/** Image alignment in the layout. */
export type ImageAlignment = 'left' | 'center' | 'right' | 'full'
/** Image size / width preset. */
export type ImageSize = 'small' | 'medium' | 'large' | 'full'

export interface RichContentSection {
  heading: string
  content: string
  type?: 'text' | 'list' | 'code' | 'diagram'
  items?: string[]
  image?: { url: string; alt?: string; attribution?: string; alignment?: ImageAlignment; size?: ImageSize }
  /** Stable block ID for editor roundtrip; set by mainTextAndBlocksToContent. */
  _blockId?: string
  /** True when this section is a standalone text block (not mainText); set by mainTextAndBlocksToContent. */
  _isBlock?: boolean
}

export interface RichInteractiveElement {
  type: 'quiz' | 'expandable' | 'code-demo' | 'diagram' | 'video' | 'audio' | 'flashcard' | 'timeline' | 'flipcard' | 'hotspot' | 'matching' | 'tabs'
  data: Record<string, unknown>
  quizMode?: QuizMode
  /** Stable block ID for editor roundtrip; set by mainTextAndBlocksToContent. */
  _blockId?: string
}

export interface RichSideCard {
  title: string
  content: string
  tips?: string[]
  noteType?: SideNoteType
}

export interface RichContent {
  type: 'rich'
  archetype?: LessonArchetype
  entryState?: EntryState
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
  /** SCORM package root URL (for resolving relative assets). Equals launch_url dir by default. */
  package_base?: string
  scorm_version?: '1.2' | '2004'
  /** Extracted plain-text from the SCO HTML files — used as Sudar's knowledge base for this module */
  scorm_text_content?: string
}

export type ModuleContent = TextContent | RichContent | ScormContent

export function isScormContent(content: unknown): content is ScormContent {
  return typeof content === 'object' && content !== null && (content as ScormContent).type === 'scorm'
}

export function isRichContent(content: unknown): content is RichContent {
  return (
    typeof content === 'object' &&
    content !== null &&
    (content as RichContent).type === 'rich' &&
    Array.isArray((content as RichContent).sections)
  )
}

/** Editor block for block-based module editing (Studio). Stored as RichContent (sections + interactiveElements). */
export type EditorBlockType = 'text' | 'image' | 'expandable' | 'quiz' | 'video' | 'timeline' | 'flipcard' | 'hotspot' | 'matching' | 'tabs' | 'audio' | 'flashcard'

export interface EditorBlockBase {
  id: string
  type: EditorBlockType
}

export interface EditorBlockText extends EditorBlockBase {
  type: 'text'
  data: { content: string }
}

export interface EditorBlockImage extends EditorBlockBase {
  type: 'image'
  data: { url: string; alt?: string; attribution?: string; alignment?: ImageAlignment; size?: ImageSize }
}

export interface EditorBlockExpandable extends EditorBlockBase {
  type: 'expandable'
  data: { title: string; content: string }
}

export interface EditorBlockQuiz extends EditorBlockBase {
  type: 'quiz'
  data: { question?: string; options?: string[]; correctAnswer?: string; explanation?: string }
}

export interface EditorBlockVideo extends EditorBlockBase {
  type: 'video'
  data: { url: string; title?: string }
}

export interface EditorBlockTimeline extends EditorBlockBase {
  type: 'timeline'
  data: { steps: { id: string; title: string; description: string; icon?: string }[] }
}

export interface EditorBlockFlipcard extends EditorBlockBase {
  type: 'flipcard'
  data: { cards: { id: string; front: string; back: string }[] }
}

export interface EditorBlockHotspot extends EditorBlockBase {
  type: 'hotspot'
  data: { imageUrl: string; spots: { x: number; y: number; label: string; content: string }[] }
}

export interface EditorBlockMatching extends EditorBlockBase {
  type: 'matching'
  data: { pairs: { id: string; term: string; definition: string }[]; instruction?: string }
}

export interface EditorBlockTabs extends EditorBlockBase {
  type: 'tabs'
  data: { tabs: { id: string; label: string; content: string }[] }
}

export interface EditorBlockAudio extends EditorBlockBase {
  type: 'audio'
  data: { url: string; title?: string; transcript?: string }
}

export interface EditorBlockFlashcard extends EditorBlockBase {
  type: 'flashcard'
  data: { cards: { id: string; front: string; back: string }[] }
}

export type EditorBlock =
  | EditorBlockText
  | EditorBlockImage
  | EditorBlockExpandable
  | EditorBlockQuiz
  | EditorBlockVideo
  | EditorBlockTimeline
  | EditorBlockFlipcard
  | EditorBlockHotspot
  | EditorBlockMatching
  | EditorBlockTabs
  | EditorBlockAudio
  | EditorBlockFlashcard

export interface VideoScene {
  sceneNumber: number
  title: string
  narration: string
  visuals?: string
  duration?: number
  /** Base64 data URL for TTS audio (optional). */
  audioDataURL?: string
}

export interface DialogueSegment {
  speaker: 'host' | 'expert'
  text: string
  /** Base64 data URL for TTS audio (optional). */
  audioDataURL?: string
}

export interface ModalityVariants {
  video?: { scenes: VideoScene[] }
  podcast?: { dialogue: DialogueSegment[] }
}
