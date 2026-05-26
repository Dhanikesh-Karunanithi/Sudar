import type { WireframeSceneId } from "@/components/wireframes/WireframeScenes";
import type { SceneState } from "@/types/sceneState";

/** Keep in sync with sudar-ecosystem-demo/src/data/ecosystemDemo.ts (hero subset). */

export type DemoHotspot = { x: number; y: number };

export type HeroLearnPhase = "course" | "tutor-proactive" | "tutor-reply";

export type HeroFlowStep = {
  title: string;
  body: string;
  scene: WireframeSceneId;
  /** Continuous Learn + tutor journey (steps 5–7) without hard scene cuts */
  learnFlowPhase?: HeroLearnPhase;
  hotspot?: DemoHotspot;
  action?: "click" | "hover";
  scenePatch?: Partial<SceneState>;
};

export const HERO_STEP_MS = 4500;

export const heroFlowSteps: HeroFlowStep[] = [
  {
    title: "Generate from an idea",
    body: "Sarah starts Somehow I manage from a prompt — engaging, rigorous office-management training.",
    scene: "studio-create-sources",
    hotspot: { x: 50, y: 48 },
    action: "click",
    scenePatch: { generationSource: "idea", highlightId: "prompt" },
  },
  {
    title: "Rich course in the editor",
    body: "Text, video, audio, accordion, flipcards, and quiz — one authoring pass, every modality.",
    scene: "studio-live-editor",
    hotspot: { x: 50, y: 55 },
    action: "click",
    scenePatch: {
      visibleBlocks: ["text", "video", "audio", "accordion", "flipcard", "quiz"],
      adaptiveLearningOn: true,
      highlightId: "adaptive",
    },
  },
  {
    title: "Cohort personalization",
    body: "Mandatory paths and due dates for learner groups, with adaptive welcome per cohort policy.",
    scene: "studio-settings",
    hotspot: { x: 50, y: 42 },
    action: "click",
    scenePatch: { highlightId: "cohort" },
  },
  {
    title: "Marcus continues learning",
    body: "Marcus opens Somehow I manage from his Learn dashboard — progress and memory in view.",
    scene: "learn-dashboard",
    hotspot: { x: 35, y: 48 },
    action: "click",
    scenePatch: { highlightId: "continue", learnNavActive: "Learn" },
  },
  {
    title: "Paused on the lesson",
    body: "Watch modality with the course visual — playhead shows where he paused when stuck.",
    scene: "learn-course-rich",
    learnFlowPhase: "course",
    hotspot: { x: 48, y: 42 },
    action: "click",
    scenePatch: { activeTab: "Watch", videoProgress: 62 },
  },
  {
    title: "Sudar already knew why",
    body: "Sudar references what's on screen before Marcus has to explain — contextual, proactive help.",
    scene: "learn-tutor-contextual",
    learnFlowPhase: "tutor-proactive",
    hotspot: { x: 88, y: 38 },
    action: "click",
    scenePatch: {
      tutorMode: "proactive",
      tutorMessage:
        "You paused on delegation in this scene. Want a Dunder-style example, or the formal definition?",
    },
  },
  {
    title: "Marcus replies in chat",
    body: "A short typed answer — Sudar responds with encouragement and a tailored explanation.",
    scene: "learn-tutor-contextual",
    learnFlowPhase: "tutor-reply",
    hotspot: { x: 88, y: 72 },
    action: "click",
    scenePatch: {
      tutorMode: "learner-reply",
      learnerDraft: "Dunder example please. Keep it short",
      tutorReply:
        "Picture Michael handing Dwight a task list — that's delegation. Outcomes, not micromanaging.",
    },
  },
  {
    title: "Memory carries forward",
    body: "My Memory tracks concepts engaged and areas of uncertainty — context for the next session.",
    scene: "learn-memory-rich",
    hotspot: { x: 50, y: 70 },
    action: "hover",
    scenePatch: { memoryHighlight: "uncertainty", learnNavActive: "Memory" },
  },
];

export function mergeHeroSceneState(step: HeroFlowStep): SceneState {
  return { ...step.scenePatch };
}
