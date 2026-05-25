export type ModalityTab = "Read" | "Listen" | "Watch" | "Map" | "Cards";

export type EcosystemLayer = "studio" | "learn" | "intelligence" | "twin";

export type GenerationSource = "document" | "idea" | "business" | "cohort" | "learner";

export type CourseBlockType = "text" | "video" | "audio" | "accordion" | "flipcard" | "quiz";

export type BloomLevel = "Understand" | "Apply" | "Analyze";

export type TutorMode = "idle" | "proactive" | "typing" | "learner-reply";

export type MemoryHighlight = "twin" | "uncertainty" | "context";

/** Cinematic framing, phone for Marcus on-the-go beats */
export type DeviceLayout = "desktop" | "mobile";

/** Triboo-style UI motion inside a static camera frame */
export type UiMotion =
  | "static"
  | "scroll-down"
  | "accordion-expand"
  | "slide-in"
  | "check-complete";

export type SceneState = {
  activeTab?: ModalityTab;
  highlightId?: string;
  studioSidebarActive?: string;
  studioView?: "courses" | "paths";
  activeModuleIndex?: number;
  settingsHighlightIndex?: number;
  ecosystemHighlight?: EcosystemLayer;
  integrationsHighlight?: "alp" | "mcp";
  tutorChipHighlight?: string;
  uiMotion?: UiMotion;
  expandedSection?: string;
  completedModules?: string[];
  /** Content generation input source */
  generationSource?: GenerationSource;
  /** Blocks visible in live editor (grows frame-by-frame) */
  visibleBlocks?: CourseBlockType[];
  bloomLevel?: BloomLevel;
  adaptiveLearningOn?: boolean;
  tutorMode?: TutorMode;
  tutorMessage?: string;
  learnerDraft?: string;
  /** Video playhead 0–100 for stuck state */
  videoProgress?: number;
  /** Animate playhead forward on mount (cinematic) */
  animateVideo?: boolean;
  /** Tutor follow-up after learner reply */
  tutorReply?: string;
  memoryHighlight?: MemoryHighlight;
  /** Learn nav active tab */
  learnNavActive?: "Learn" | "Courses" | "Paths" | "Progress" | "Memory";
  accordionExpanded?: boolean;
  flipcardFlipped?: boolean;
  deviceLayout?: DeviceLayout;
};

export const defaultSceneState: SceneState = {};
