import type { WireframeSceneId } from "@/components/wireframes/WireframeScenes";
import type { DemoHotspot } from "@/data/ecosystemDemo";
import type { AudioCue } from "@/lib/cinematicAudio";
import type { CourseBlockType, SceneState } from "@/types/sceneState";

export type OverlayPosition = "lower-third" | "center" | "upper";

export type CameraEffect = "zoom-in" | "zoom-out" | "push-left" | "push-right" | "static";

export type TitleCardFrame = {
  type: "title-card";
  id: string;
  durationMs: number;
  eyebrow?: string;
  headline: string;
  subhead?: string;
  showLogo?: boolean;
  logoOnly?: boolean;
  audioCue?: AudioCue;
};

export type SceneFrame = {
  type: "scene";
  id: string;
  durationMs: number;
  scene: WireframeSceneId;
  scenePatch?: Partial<SceneState>;
  hotspot?: DemoHotspot;
  action?: "click" | "hover";
  audioCue?: AudioCue;
  cameraEffect?: CameraEffect;
  overlay: {
    position: OverlayPosition;
    eyebrow?: string;
    headline: string;
    body?: string;
  };
};

export type CinematicFrame = TitleCardFrame | SceneFrame;

const FULL_BLOCKS: CourseBlockType[] = [
  "text",
  "video",
  "audio",
  "accordion",
  "flipcard",
  "quiz",
];

const BUILD_ONE_BLOCKS: CourseBlockType[] = ["text", "video"];

/** Marcus on-the-go, phone framing for Learn scenes */
const MOBILE_LEARN: Partial<SceneState> = { deviceLayout: "mobile" };

export const launchFrames: CinematicFrame[] = [
  {
    type: "title-card",
    id: "open",
    durationMs: 6000,
    headline: "Learns with you, for you.",
    showLogo: true,
    logoOnly: true,
    audioCue: "title",
  },
  {
    type: "title-card",
    id: "gap-1",
    durationMs: 6000,
    audioCue: "whoosh",
    headline: "Your learners forget 70% of training within 72 hours.",
  },
  {
    type: "title-card",
    id: "gap-2",
    durationMs: 7000,
    headline: "1:1 tutoring is 2× more effective than a classroom.",
    subhead: "Bloom proved it in 1984.",
  },
  {
    type: "title-card",
    id: "gap-3",
    durationMs: 7500,
    headline: "We can deliver that to every learner.",
    subhead: "For less than $0.02 a month.",
  },
  {
    type: "scene",
    id: "meet-sudar",
    durationMs: 7000,
    scene: "ecosystem-map",
    cameraEffect: "zoom-in",
    scenePatch: { ecosystemHighlight: "twin" },
    hotspot: { x: 50, y: 50 },
    action: "hover",
    overlay: {
      position: "lower-third",
      eyebrow: "Introducing",
      headline: "Sudar. The learning OS.",
      body: "Create once. Deliver every way. Remember every learner.",
    },
  },
  {
    type: "title-card",
    id: "sarah-intro",
    durationMs: 6000,
    eyebrow: "The creator",
    headline: "Meet Sarah.",
    subhead: "500 stores. No production team.",
  },
  {
    type: "scene",
    id: "sarah-idea",
    durationMs: 7000,
    scene: "studio-create-sources",
    cameraEffect: "zoom-in",
    scenePatch: { generationSource: "idea", highlightId: "prompt" },
    hotspot: { x: 50, y: 48 },
    action: "click",
    audioCue: "click",
    overlay: {
      position: "lower-third",
      headline: "She types an idea.",
      body: "Fun office management, still rigorous.",
    },
  },
  {
    type: "scene",
    id: "sarah-blueprint",
    durationMs: 7000,
    scene: "studio-id-blueprint",
    cameraEffect: "push-right",
    scenePatch: { bloomLevel: "Apply" },
    hotspot: { x: 78, y: 40 },
    action: "hover",
    overlay: {
      position: "lower-third",
      headline: "AI structures it to Bloom's level.",
      body: "Apply objectives. Scenario archetype. Every module.",
    },
  },
  {
    type: "scene",
    id: "sarah-build-1",
    durationMs: 6000,
    scene: "studio-live-editor",
    cameraEffect: "zoom-in",
    scenePatch: {
      visibleBlocks: BUILD_ONE_BLOCKS,
      uiMotion: "slide-in",
      highlightId: "add-block",
      activeModuleIndex: 0,
    },
    hotspot: { x: 85, y: 72 },
    action: "click",
    audioCue: "click",
    overlay: {
      position: "lower-third",
      headline: "Five modules. Built live.",
    },
  },
  {
    type: "scene",
    id: "sarah-build-2",
    durationMs: 6500,
    scene: "studio-live-editor",
    cameraEffect: "zoom-in",
    scenePatch: {
      visibleBlocks: FULL_BLOCKS,
      uiMotion: "slide-in",
      highlightId: "add-block",
      activeModuleIndex: 0,
    },
    hotspot: { x: 85, y: 72 },
    action: "click",
    audioCue: "success",
    overlay: {
      position: "lower-third",
      headline: "Video. Audio. Interactive.",
      body: "Somehow I manage, World's Best Boss 101.",
    },
  },
  {
    type: "scene",
    id: "sarah-adaptive",
    durationMs: 5500,
    scene: "studio-live-editor",
    cameraEffect: "static",
    scenePatch: {
      visibleBlocks: FULL_BLOCKS,
      adaptiveLearningOn: true,
      highlightId: "adaptive",
    },
    hotspot: { x: 50, y: 55 },
    action: "click",
    overlay: {
      position: "lower-third",
      headline: "Adaptive learning, on.",
      body: "Personalized for every learner on enrollment.",
    },
  },
  {
    type: "title-card",
    id: "sarah-done",
    durationMs: 5000,
    headline: "12 minutes. Course live.",
    audioCue: "success",
  },
  {
    type: "title-card",
    id: "personalization",
    durationMs: 5000,
    eyebrow: "Personalization",
    headline: "One course. Different people.",
  },
  {
    type: "scene",
    id: "cohort",
    durationMs: 7000,
    scene: "studio-settings",
    cameraEffect: "push-left",
    scenePatch: { highlightId: "cohort" },
    hotspot: { x: 50, y: 42 },
    action: "click",
    audioCue: "click",
    overlay: {
      position: "lower-third",
      headline: "Group context, set by Sarah.",
      body: "New hire store managers · mandatory path.",
    },
  },
  {
    type: "scene",
    id: "individual",
    durationMs: 7000,
    scene: "learn-memory-rich",
    cameraEffect: "push-right",
    scenePatch: { ...MOBILE_LEARN, memoryHighlight: "context", learnNavActive: "Memory" },
    hotspot: { x: 50, y: 75 },
    action: "hover",
    overlay: {
      position: "lower-third",
      headline: "Personal context, set by Marcus.",
      body: "Goals and style, in every conversation.",
    },
  },
  {
    type: "title-card",
    id: "marcus-intro",
    durationMs: 6000,
    eyebrow: "The learner",
    headline: "Meet Marcus.",
    subhead: "Lagos. Phone. Between shifts.",
  },
  {
    type: "scene",
    id: "marcus-dash",
    durationMs: 7000,
    scene: "learn-dashboard",
    cameraEffect: "zoom-in",
    scenePatch: { ...MOBILE_LEARN, highlightId: "continue", learnNavActive: "Learn" },
    hotspot: { x: 35, y: 48 },
    action: "click",
    audioCue: "click",
    overlay: {
      position: "lower-third",
      headline: "His course is waiting.",
      body: "Assigned. Shaped for him.",
    },
  },
  {
    type: "scene",
    id: "marcus-watch",
    durationMs: 7500,
    scene: "learn-course-rich",
    cameraEffect: "zoom-in",
    scenePatch: { ...MOBILE_LEARN, activeTab: "Watch", videoProgress: 35, animateVideo: true },
    hotspot: { x: 44, y: 22 },
    action: "click",
    overlay: {
      position: "lower-third",
      headline: "He learns by watching.",
      body: "Sudar knows his style.",
    },
  },
  {
    type: "scene",
    id: "marcus-stuck",
    durationMs: 7000,
    scene: "learn-course-rich",
    cameraEffect: "zoom-in",
    scenePatch: {
      ...MOBILE_LEARN,
      activeTab: "Watch",
      videoProgress: 62,
      accordionExpanded: true,
      flipcardFlipped: true,
    },
    hotspot: { x: 50, y: 45 },
    action: "click",
    overlay: {
      position: "lower-third",
      headline: "He pauses. Twice.",
      body: "Delegation, still stuck.",
    },
  },
  {
    type: "scene",
    id: "tutor-proactive",
    durationMs: 9000,
    scene: "learn-tutor-contextual",
    cameraEffect: "zoom-in",
    scenePatch: {
      ...MOBILE_LEARN,
      tutorMode: "proactive",
      tutorMessage:
        "You paused on delegation in this scene. Want a Dunder-style example, or the formal definition?",
    },
    hotspot: { x: 78, y: 55 },
    action: "hover",
    overlay: {
      position: "lower-third",
      headline: "Sudar notices.",
      body: "Before he asks.",
    },
  },
  {
    type: "scene",
    id: "tutor-reply",
    durationMs: 8000,
    scene: "learn-tutor-contextual",
    cameraEffect: "push-left",
    scenePatch: {
      ...MOBILE_LEARN,
      tutorMode: "learner-reply",
      learnerDraft: "Dunder example please. Keep it short",
      tutorMessage:
        "You paused on delegation in this scene. Want a Dunder-style example, or the formal definition?",
      tutorReply:
        "Picture Michael handing Dwight a task list, that's delegation. Outcomes, not micromanaging.",
    },
    hotspot: { x: 75, y: 82 },
    action: "click",
    audioCue: "click",
    overlay: {
      position: "lower-third",
      headline: "He replies. Sudar responds.",
      body: "Encouraging. Specific. Never judgmental.",
    },
  },
  {
    type: "scene",
    id: "memory",
    durationMs: 7000,
    scene: "learn-memory-rich",
    cameraEffect: "zoom-out",
    scenePatch: { ...MOBILE_LEARN, memoryHighlight: "uncertainty", learnNavActive: "Memory" },
    hotspot: { x: 50, y: 70 },
    action: "hover",
    overlay: {
      position: "lower-third",
      headline: "Logged.",
      body: "For every session after this.",
    },
  },
  {
    type: "scene",
    id: "result",
    durationMs: 7000,
    scene: "analytics-compliance",
    cameraEffect: "zoom-in",
    scenePatch: { highlightId: "at-risk" },
    hotspot: { x: 50, y: 62 },
    action: "click",
    overlay: {
      position: "lower-third",
      headline: "Certified.",
      body: "Sarah sees it in real time.",
    },
  },
  {
    type: "title-card",
    id: "cost",
    durationMs: 6000,
    headline: "15 minutes. $0.02. One learner.",
    subhead: "From idea to certified, video, audio, interactives included.",
    audioCue: "success",
  },
  {
    type: "title-card",
    id: "integrations",
    durationMs: 5000,
    eyebrow: "Integrations",
    headline: "Keep your LMS.",
    subhead: "No rip and replace.",
  },
  {
    type: "scene",
    id: "alp",
    durationMs: 7000,
    scene: "studio-integrations",
    cameraEffect: "push-left",
    scenePatch: { integrationsHighlight: "alp", highlightId: "copy-key" },
    hotspot: { x: 28, y: 42 },
    action: "click",
    audioCue: "click",
    overlay: {
      position: "lower-third",
      headline: "Connect it.",
      body: "Events in. Intelligence out.",
    },
  },
  {
    type: "scene",
    id: "alp-flow",
    durationMs: 7000,
    scene: "alp-flow",
    cameraEffect: "static",
    hotspot: { x: 50, y: 50 },
    action: "hover",
    overlay: {
      position: "lower-third",
      headline: "Moodle. Canvas. Blackboard.",
      body: "The Twin joins them.",
    },
  },
  {
    type: "title-card",
    id: "close-1",
    durationMs: 5000,
    headline: "Sudar.",
    showLogo: true,
  },
  {
    type: "title-card",
    id: "close-2",
    durationMs: 7000,
    headline: "Learns with you, for you.",
    showLogo: true,
    subhead: "teachwithsudar.com",
  },
];

export const totalLaunchDurationMs = launchFrames.reduce((sum, f) => sum + f.durationMs, 0);

export function mergeLaunchSceneState(frame: SceneFrame): SceneState {
  return { ...frame.scenePatch };
}

export function getFrameAudioCue(frame: CinematicFrame): AudioCue | undefined {
  if (frame.audioCue) return frame.audioCue;
  if (frame.type === "title-card") {
    if (frame.logoOnly) return "title";
    return "whoosh";
  }
  if (frame.action === "click") return "click";
  return "whoosh";
}
