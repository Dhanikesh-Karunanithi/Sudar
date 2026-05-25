import type { WireframeSceneId } from "@/components/wireframes/WireframeScenes";
import type { SceneState } from "@/types/sceneState";

export type DemoHotspot = { x: number; y: number };

export type DemoStep = {
  title: string;
  body: string;
  scene: WireframeSceneId;
  hotspot?: DemoHotspot;
  action?: "click" | "hover";
  scenePatch?: Partial<SceneState>;
  callout?: string;
};

export type DemoChapter = {
  id: string;
  title: string;
  steps: DemoStep[];
};

export const DEFAULT_STEP_MS = 5000;

export const ecosystemChapters: DemoChapter[] = [
  {
    id: "learning-os",
    title: "The Learning OS",
    steps: [
      {
        title: "One platform, four layers",
        body: "Sudar is an AI-native Learning Operating System: Studio for creation, Learn for delivery, Intelligence for heavy AI, and a Digital Learner Twin that remembers every learner.",
        scene: "ecosystem-map",
        action: "hover",
        hotspot: { x: 50, y: 18 },
        scenePatch: { ecosystemHighlight: "studio" },
      },
      {
        title: "Learner delivery surface",
        body: "Sudar Learn hosts courses, modalities, the tutor, and the Digital Learner Twin, every interaction feeds personalization.",
        scene: "ecosystem-map",
        hotspot: { x: 50, y: 38 },
        scenePatch: { ecosystemHighlight: "learn" },
      },
      {
        title: "Intelligence & data",
        body: "Sudar Intelligence runs generation, TTS, and tutor backends. The Twin accumulates profiles, content signals, and learning events over time.",
        scene: "ecosystem-map",
        hotspot: { x: 50, y: 72 },
        scenePatch: { ecosystemHighlight: "intelligence" },
      },
    ],
  },
  {
    id: "content-generation",
    title: "Content generation",
    steps: [
      {
        title: "Many ways to start",
        body: "Sarah opens Studio and starts a course from a document, an idea, a business need, cohort rules, or individual learner context.",
        scene: "studio-dashboard",
        hotspot: { x: 58, y: 28 },
        scenePatch: { highlightId: "new-course", studioSidebarActive: "Courses" },
        callout: "Document · Idea · Business need",
      },
      {
        title: "Generate from an idea",
        body: "A prompt is enough: fun office-management training in Michael Scott's voice, engaging, relatable, still rigorous.",
        scene: "studio-create-sources",
        hotspot: { x: 50, y: 48 },
        scenePatch: { generationSource: "idea", highlightId: "prompt" },
      },
      {
        title: "Anchor to business need",
        body: "Sudar aligns objectives to operator goals, e.g. reduce manager escalations for new hire store managers.",
        scene: "studio-create-sources",
        hotspot: { x: 72, y: 32 },
        scenePatch: { generationSource: "business" },
      },
      {
        title: "Instructional design blueprint",
        body: "Outlines follow Bloom's levels, learning objectives, and archetypes, the same pipeline as production Studio generation.",
        scene: "studio-id-blueprint",
        hotspot: { x: 78, y: 40 },
        scenePatch: { bloomLevel: "Apply" },
        callout: "Bloom · Archetype · Objectives",
      },
    ],
  },
  {
    id: "live-editor",
    title: "Live editor blocks",
    steps: [
      {
        title: "Add text and video",
        body: "Modules gain text, AI-generated video (SudarVid), and podcast audio, blocks appear as the creator builds.",
        scene: "studio-live-editor",
        hotspot: { x: 85, y: 72 },
        scenePatch: {
          visibleBlocks: ["text", "video"],
          uiMotion: "slide-in",
          highlightId: "add-block",
        },
      },
      {
        title: "Audio and accordion",
        body: "Listen on the go; expandable sections for depth, no second authoring pass.",
        scene: "studio-live-editor",
        hotspot: { x: 85, y: 72 },
        scenePatch: {
          visibleBlocks: ["text", "video", "audio", "accordion"],
          uiMotion: "slide-in",
        },
      },
      {
        title: "Flip cards and quiz",
        body: "Flipcards for recall; quizzes mapped to Apply-level objectives. Adaptive Learning personalizes welcome on enroll.",
        scene: "studio-live-editor",
        hotspot: { x: 50, y: 55 },
        scenePatch: {
          visibleBlocks: ["text", "video", "audio", "accordion", "flipcard", "quiz"],
          adaptiveLearningOn: true,
          highlightId: "adaptive",
        },
      },
    ],
  },
  {
    id: "personalization",
    title: "Personalization",
    steps: [
      {
        title: "Cohort assignment",
        body: "Mandatory paths and due dates for learner groups, adaptive welcome per cohort policy.",
        scene: "studio-settings",
        hotspot: { x: 50, y: 42 },
        scenePatch: { highlightId: "cohort" },
      },
      {
        title: "Individual learner context",
        body: "Learners add background, goals, and how they learn best, injected into every Sudar conversation.",
        scene: "learn-memory-rich",
        hotspot: { x: 50, y: 75 },
        scenePatch: { memoryHighlight: "context", learnNavActive: "Memory" },
      },
      {
        title: "Org policy in Studio",
        body: "Sarah enables AI personalization, audience targeting, and consent rules under Org settings.",
        scene: "studio-settings",
        hotspot: { x: 50, y: 38 },
        scenePatch: { settingsHighlightIndex: 1 },
      },
    ],
  },
  {
    id: "intelligence",
    title: "Sudar Intelligence",
    steps: [
      {
        title: "AI generation pipeline",
        body: "Studio and Learn call Sudar Intelligence for outlines, tutor RAG, TTS, and adaptive scoring, not a bolt-on chatbot.",
        scene: "intelligence-pipeline",
        hotspot: { x: 72, y: 38 },
        scenePatch: { highlightId: "generate" },
      },
      {
        title: "SudarVid · Watch",
        body: "The Watch modality uses SudarVid: slide planning, image gen, TTS, and FFmpeg, learners see the same module in Read, Listen, or Watch.",
        scene: "sudar-vid",
        hotspot: { x: 50, y: 35 },
      },
    ],
  },
  {
    id: "learner-experience",
    title: "Learner experience",
    steps: [
      {
        title: "Continue learning",
        body: "Marcus opens Somehow I manage from his Learn dashboard, progress and memory banner visible.",
        scene: "learn-dashboard",
        hotspot: { x: 35, y: 48 },
        scenePatch: { highlightId: "continue", learnNavActive: "Learn" },
      },
      {
        title: "Watch the lesson",
        body: "Video modality with Prison Mike / course visual; playhead shows where he paused when stuck.",
        scene: "learn-course-rich",
        hotspot: { x: 50, y: 45 },
        scenePatch: { activeTab: "Watch", videoProgress: 62 },
      },
      {
        title: "Interact with blocks",
        body: "Accordion and flipcards in the same lesson, engaging without leaving the flow.",
        scene: "learn-course-rich",
        hotspot: { x: 40, y: 68 },
        scenePatch: {
          activeTab: "Watch",
          accordionExpanded: true,
          flipcardFlipped: true,
        },
      },
    ],
  },
  {
    id: "tutor",
    title: "Tutor Sudar",
    steps: [
      {
        title: "Contextual proactive help",
        body: "Sudar references what's on screen, delegation in the video, before Marcus has to type.",
        scene: "learn-tutor-contextual",
        hotspot: { x: 78, y: 55 },
        scenePatch: {
          tutorMode: "proactive",
          tutorMessage:
            "You paused on delegation in this scene. Want a Dunder-style example, or the formal definition?",
        },
      },
      {
        title: "Learner replies in chat",
        body: "Marcus types a short answer; Sudar responds with encouragement and a tailored explanation.",
        scene: "learn-tutor-contextual",
        hotspot: { x: 75, y: 82 },
        scenePatch: {
          tutorMode: "learner-reply",
          learnerDraft: "Dunder example please. Keep it short",
        },
        callout: "Screen-aware · Non-judgmental",
      },
      {
        title: "Memory and uncertainty",
        body: "My Memory shows concepts engaged and areas of uncertainty, AI-observed, read-only where appropriate.",
        scene: "learn-memory-rich",
        hotspot: { x: 50, y: 70 },
        scenePatch: { memoryHighlight: "uncertainty", learnNavActive: "Memory" },
      },
    ],
  },
  {
    id: "paths",
    title: "Assign & paths",
    steps: [
      {
        title: "Learning paths",
        body: "Sarah builds a mandatory compliance path with due dates and assigns store managers including Marcus.",
        scene: "studio-dashboard",
        hotspot: { x: 62, y: 48 },
        scenePatch: { studioView: "paths", studioSidebarActive: "Paths", highlightId: "path-card" },
      },
    ],
  },
  {
    id: "engagement",
    title: "Engagement",
    steps: [
      {
        title: "Notification sounds",
        body: "Optional chimes for task complete, tutor reply, and celebrations, with quiet hours and reduced motion.",
        scene: "learn-settings",
        hotspot: { x: 42, y: 42 },
        scenePatch: { highlightId: "sound-slider" },
      },
      {
        title: "Quests, coins, achievements",
        body: "Gamification loop drives daily check-ins and milestones; events land in learning_events for analytics.",
        scene: "gamification",
        hotspot: { x: 82, y: 42 },
        scenePatch: { highlightId: "quest" },
      },
    ],
  },
  {
    id: "alp",
    title: "ALP · Moodle",
    steps: [
      {
        title: "ALP API key",
        body: "Operators generate an ALP key in Studio Integrations for Moodle plugins without replacing the LMS.",
        scene: "studio-integrations",
        hotspot: { x: 28, y: 42 },
        scenePatch: { integrationsHighlight: "alp", highlightId: "copy-key" },
      },
      {
        title: "Events to the Twin",
        body: "SudarMemory posts completions and time-on-task to POST /api/alp/events, twin rollups stay in sync.",
        scene: "alp-flow",
        hotspot: { x: 50, y: 50 },
      },
    ],
  },
  {
    id: "mcp",
    title: "MCP connectors",
    steps: [
      {
        title: "ChatGPT & Cursor",
        body: "Connect mcp.thesudar.app for OAuth remote MCP, or stdio for Cursor with creator and integrator toolsets.",
        scene: "studio-integrations",
        hotspot: { x: 78, y: 42 },
        scenePatch: { integrationsHighlight: "mcp", highlightId: "mcp-json" },
      },
    ],
  },
  {
    id: "ops-trust",
    title: "Ops & trust",
    steps: [
      {
        title: "Analytics & compliance",
        body: "Sarah sees Marcus complete in real time; at-risk learners surface for compliance reminders via cron + Resend.",
        scene: "analytics-compliance",
        hotspot: { x: 50, y: 62 },
        scenePatch: { highlightId: "at-risk" },
      },
      {
        title: "Trust documentation",
        body: "Studio Governance links to docs/trust, data flows, subprocessors, and AI system register for procurement.",
        scene: "studio-settings",
        hotspot: { x: 50, y: 72 },
        scenePatch: { settingsHighlightIndex: 3 },
      },
    ],
  },
  {
    id: "close",
    title: "The full loop",
    steps: [
      {
        title: "From idea to certified learner",
        body: "Idea or document to rich course in Studio, personalized delivery in Learn, integrations via ALP and MCP, one ecosystem.",
        scene: "ecosystem-map",
        action: "hover",
        hotspot: { x: 50, y: 50 },
      },
      {
        title: "Learns with you, for you.",
        body: "Sudar democratizes world-class training: AI that remembers every learner and adapts everything to them.",
        scene: "ecosystem-map",
        hotspot: { x: 50, y: 88 },
      },
    ],
  },
];

export type FlatStep = DemoStep & {
  chapterId: string;
  chapterTitle: string;
  globalIndex: number;
  chapterIndex: number;
  stepInChapter: number;
};

export function flattenChapters(chapters: DemoChapter[]): FlatStep[] {
  const flat: FlatStep[] = [];
  let globalIndex = 0;
  chapters.forEach((chapter, chapterIndex) => {
    chapter.steps.forEach((step, stepInChapter) => {
      flat.push({
        ...step,
        chapterId: chapter.id,
        chapterTitle: chapter.title,
        globalIndex,
        chapterIndex,
        stepInChapter,
      });
      globalIndex += 1;
    });
  });
  return flat;
}

export const flatSteps = flattenChapters(ecosystemChapters);

export function getChapterStartIndex(chapterId: string): number {
  const idx = flatSteps.findIndex((s) => s.chapterId === chapterId);
  return idx >= 0 ? idx : 0;
}

export function mergeSceneState(step: DemoStep): SceneState {
  return { ...step.scenePatch };
}
