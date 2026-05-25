import type { WireframeSceneId } from "@/components/wireframes/WireframeScenes";
import type { DemoHotspot } from "@/data/ecosystemDemo";
import type { AudioCue } from "@/lib/cinematicAudio";
import type { CourseBlockType, SceneState } from "@/types/sceneState";

export type OverlayPosition = "lower-third" | "center" | "upper";

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
  overlay: {
    position: OverlayPosition;
    eyebrow?: string;
    headline: string;
    body?: string;
  };
};

export type CinematicFrame = TitleCardFrame | SceneFrame;

const BLOCK_STEPS: CourseBlockType[] = [
  "text",
  "video",
  "audio",
  "accordion",
  "flipcard",
  "quiz",
];

function blockPatch(index: number): Partial<SceneState> {
  return {
    visibleBlocks: BLOCK_STEPS.slice(0, index + 1),
    uiMotion: "slide-in",
    highlightId: "add-block",
    activeModuleIndex: 0,
  };
}

export const launchFrames: CinematicFrame[] = [
  {
    type: "title-card",
    id: "open",
    durationMs: 7500,
    headline: "Learns with you, for you.",
    showLogo: true,
    logoOnly: true,
    audioCue: "title",
  },
  {
    type: "title-card",
    id: "act1-1",
    durationMs: 9500,
    audioCue: "whoosh",
    headline: "Corporate training is failing millions of learners.",
  },
  {
    type: "title-card",
    id: "act1-2",
    durationMs: 7000,
    headline: "Teams forget most of what you teach them. Within days.",
  },
  {
    type: "title-card",
    id: "act1-3",
    durationMs: 9500,
    headline: "The tools haven't changed in thirty years. The world has.",
  },
  {
    type: "title-card",
    id: "act2-1",
    durationMs: 7000,
    headline: "What if learning could learn you?",
  },
  {
    type: "scene",
    id: "act2-2",
    durationMs: 8200,
    scene: "ecosystem-map",
    scenePatch: { ecosystemHighlight: "studio" },
    hotspot: { x: 50, y: 22 },
    action: "hover",
    overlay: {
      position: "lower-third",
      eyebrow: "Introducing",
      headline: "Sudar.",
      body: "The Learning Operating System.",
    },
  },
  {
    type: "scene",
    id: "act2-3",
    durationMs: 8200,
    scene: "ecosystem-map",
    scenePatch: { ecosystemHighlight: "twin" },
    hotspot: { x: 50, y: 72 },
    action: "hover",
    overlay: {
      position: "lower-third",
      headline: "Create once. Deliver every way. Remember every learner.",
    },
  },
  // Act 3 — Sarah creates (content generation)
  {
    type: "title-card",
    id: "act3-1",
    durationMs: 7000,
    eyebrow: "The creator",
    headline: "Meet Sarah.",
    subhead: "L&D for five hundred stores. No video team. No instructional design army.",
  },
  {
    type: "scene",
    id: "act3-2",
    durationMs: 8500,
    scene: "studio-dashboard",
    scenePatch: { highlightId: "new-course", studioSidebarActive: "Courses" },
    hotspot: { x: 58, y: 28 },
    action: "click",
    audioCue: "click",
    overlay: {
      position: "lower-third",
      headline: "Start from anywhere.",
      body: "Document · idea · business need · cohort · learner context.",
    },
  },
  {
    type: "scene",
    id: "act3-3",
    durationMs: 9200,
    scene: "studio-create-sources",
    scenePatch: { generationSource: "idea", highlightId: "prompt" },
    hotspot: { x: 50, y: 48 },
    action: "click",
    audioCue: "click",
    overlay: {
      position: "lower-third",
      headline: "An idea is enough.",
      body: "Fun ways to manage an office — taught by Michael Scott. Engaging. Still rigorous.",
    },
  },
  {
    type: "scene",
    id: "act3-4",
    durationMs: 8200,
    scene: "studio-create-sources",
    scenePatch: { generationSource: "business", highlightId: "business" },
    hotspot: { x: 72, y: 32 },
    action: "click",
    overlay: {
      position: "lower-third",
      headline: "Ground it in the business.",
      body: "Reduce manager escalations in Q3 — Sudar shapes objectives and tone.",
    },
  },
  {
    type: "scene",
    id: "act3-5",
    durationMs: 8800,
    scene: "studio-id-blueprint",
    scenePatch: { bloomLevel: "Apply" },
    hotspot: { x: 78, y: 40 },
    action: "hover",
    overlay: {
      position: "lower-third",
      headline: "Built on learning science.",
      body: "Bloom's taxonomy · instructional archetypes · clear objectives — not random AI text.",
    },
  },
  ...BLOCK_STEPS.map(
    (block, i): SceneFrame => ({
      type: "scene",
      id: `act3-block-${block}`,
      durationMs: i === 0 ? 8500 : 7800,
      scene: "studio-live-editor",
      scenePatch: blockPatch(i),
      hotspot: { x: 85, y: 72 },
      action: "click",
      audioCue: i === BLOCK_STEPS.length - 1 ? "success" : "click",
      overlay: {
        position: "lower-third",
        headline:
          i === 0
            ? "She builds the module live."
            : i === 1
              ? "Video. Generated. No production crew."
              : i === 2
                ? "Audio for commuters."
                : i === 3
                  ? "Accordions for depth."
                  : i === 4
                    ? "Flip cards for recall."
                    : "Quizzes that respect Bloom's Apply level.",
        body:
          i === 1
            ? "Somehow I manage — World's Best Boss 101."
            : undefined,
      },
    })
  ),
  {
    type: "scene",
    id: "act3-adaptive",
    durationMs: 8200,
    scene: "studio-live-editor",
    scenePatch: {
      visibleBlocks: BLOCK_STEPS,
      adaptiveLearningOn: true,
      highlightId: "adaptive",
    },
    hotspot: { x: 50, y: 55 },
    action: "click",
    overlay: {
      position: "lower-third",
      headline: "Adaptive Learning on.",
      body: "Every enrollee gets a welcome that bridges their context to this course.",
    },
  },
  {
    type: "title-card",
    id: "act3-publish",
    durationMs: 7000,
    headline: "Twelve minutes.",
    subhead: "From idea to Somehow I manage — live in Learn.",
    audioCue: "success",
  },
  // Act 4 — Personalization
  {
    type: "title-card",
    id: "act4-0",
    durationMs: 6000,
    eyebrow: "Personalization",
    headline: "One course. Many learners.",
  },
  {
    type: "scene",
    id: "act4-cohort",
    durationMs: 8500,
    scene: "studio-settings",
    scenePatch: { highlightId: "cohort" },
    hotspot: { x: 50, y: 42 },
    action: "click",
    overlay: {
      position: "lower-third",
      headline: "Cohort targeting.",
      body: "New hire store managers — mandatory path, adaptive welcome for the group.",
    },
  },
  {
    type: "scene",
    id: "act4-individual",
    durationMs: 8800,
    scene: "learn-memory-rich",
    scenePatch: { memoryHighlight: "context", learnNavActive: "Memory" },
    hotspot: { x: 50, y: 75 },
    action: "hover",
    overlay: {
      position: "lower-third",
      headline: "Individual context.",
      body: "Background, goals, how they learn best — injected into every Sudar conversation.",
    },
  },
  {
    type: "title-card",
    id: "act4-same",
    durationMs: 6800,
    headline: "Same course. Different pace. Different voice.",
    subhead: "Engaging and intuitive — because Sudar knows the learner.",
  },
  // Act 5 — Marcus learns
  {
    type: "title-card",
    id: "act5-1",
    durationMs: 7000,
    eyebrow: "The learner",
    headline: "Meet Marcus.",
    subhead: "Store manager in Lagos. On his phone. Between shifts.",
  },
  {
    type: "scene",
    id: "act5-2",
    durationMs: 8200,
    scene: "learn-dashboard",
    scenePatch: { highlightId: "continue", learnNavActive: "Learn" },
    hotspot: { x: 35, y: 48 },
    action: "click",
    audioCue: "click",
    overlay: {
      position: "lower-third",
      headline: "Somehow I manage is waiting.",
      body: "Assigned. Personalised. Ready.",
    },
  },
  {
    type: "scene",
    id: "act5-watch-start",
    durationMs: 8200,
    scene: "learn-course-rich",
    scenePatch: { activeTab: "Watch", videoProgress: 35 },
    hotspot: { x: 44, y: 22 },
    action: "click",
    overlay: {
      position: "lower-third",
      headline: "He learns by watching first.",
      body: "Sudar opens on video — because the Twin knows his style.",
    },
  },
  {
    type: "scene",
    id: "act5-stuck",
    durationMs: 8800,
    scene: "learn-course-rich",
    scenePatch: { activeTab: "Watch", videoProgress: 62 },
    hotspot: { x: 50, y: 45 },
    action: "click",
    overlay: {
      position: "lower-third",
      headline: "He pauses. Stuck on delegation.",
    },
  },
  {
    type: "scene",
    id: "act5-interact",
    durationMs: 8200,
    scene: "learn-course-rich",
    scenePatch: {
      activeTab: "Watch",
      videoProgress: 62,
      accordionExpanded: true,
      flipcardFlipped: true,
    },
    hotspot: { x: 40, y: 68 },
    action: "click",
    audioCue: "click",
    overlay: {
      position: "lower-third",
      headline: "Accordion. Flip cards. Same lesson — more ways in.",
    },
  },
  {
    type: "scene",
    id: "act5-tutor-proactive",
    durationMs: 9200,
    scene: "learn-tutor-contextual",
    scenePatch: {
      tutorMode: "proactive",
      tutorMessage:
        "You paused on delegation in this scene — want a Dunder-style example, or the formal definition?",
    },
    hotspot: { x: 78, y: 55 },
    action: "hover",
    overlay: {
      position: "lower-third",
      headline: "Sudar speaks to what's on screen.",
      body: "Not a generic chatbot — context from the lesson you're in.",
    },
  },
  {
    type: "scene",
    id: "act5-tutor-reply",
    durationMs: 9500,
    scene: "learn-tutor-contextual",
    scenePatch: {
      tutorMode: "learner-reply",
      learnerDraft: "Dunder example please — keep it short",
      tutorMessage:
        "You paused on delegation in this scene — want a Dunder-style example, or the formal definition?",
    },
    hotspot: { x: 75, y: 82 },
    action: "click",
    audioCue: "click",
    overlay: {
      position: "lower-third",
      headline: "Marcus answers in his own words.",
      body: "Sudar responds — encouraging, specific, never judgmental.",
    },
  },
  {
    type: "scene",
    id: "act5-memory",
    durationMs: 8500,
    scene: "learn-memory-rich",
    scenePatch: { memoryHighlight: "uncertainty", learnNavActive: "Memory" },
    hotspot: { x: 50, y: 70 },
    action: "hover",
    overlay: {
      position: "lower-third",
      headline: "Sudar already knew where he struggles.",
      body: "Uncertainty tags feed the Twin — before he had to ask.",
    },
  },
  // Act 6 — Twin
  {
    type: "scene",
    id: "act6-1",
    durationMs: 8200,
    scene: "learn-memory-rich",
    scenePatch: { memoryHighlight: "twin", learnNavActive: "Memory" },
    hotspot: { x: 50, y: 38 },
    overlay: {
      position: "center",
      headline: "Every LMS tracks completions.",
      body: "Sudar tracks learning. The Digital Learner Twin remembers.",
    },
  },
  // Act 7 — Result
  {
    type: "scene",
    id: "act7-1",
    durationMs: 8200,
    scene: "analytics-compliance",
    scenePatch: { highlightId: "at-risk" },
    hotspot: { x: 50, y: 62 },
    action: "click",
    overlay: {
      position: "lower-third",
      headline: "Marcus is certified.",
      body: "Sarah sees it in real time.",
    },
  },
  {
    type: "title-card",
    id: "act7-2",
    durationMs: 8200,
    headline: "Fifteen minutes. Under fifty cents.",
    subhead: "From idea to certified learner — video, audio, interactives included.",
  },
  // Act 8 — Ecosystem
  {
    type: "scene",
    id: "act8-1",
    durationMs: 8200,
    scene: "studio-integrations",
    scenePatch: { integrationsHighlight: "alp", highlightId: "copy-key" },
    hotspot: { x: 28, y: 42 },
    action: "click",
    overlay: {
      position: "lower-third",
      headline: "Keep your LMS. Add Sudar.",
      body: "No rip and replace.",
    },
  },
  {
    type: "scene",
    id: "act8-2",
    durationMs: 8200,
    scene: "alp-flow",
    hotspot: { x: 50, y: 50 },
    action: "hover",
    overlay: {
      position: "lower-third",
      headline: "Moodle. Canvas. Blackboard.",
      body: "Events in. The Twin learns.",
    },
  },
  {
    type: "scene",
    id: "act8-3",
    durationMs: 8200,
    scene: "studio-integrations",
    scenePatch: { integrationsHighlight: "mcp", highlightId: "mcp-json" },
    hotspot: { x: 78, y: 42 },
    action: "click",
    overlay: {
      position: "lower-third",
      headline: "Build from ChatGPT. From Cursor.",
      body: "Your stack. Sudar's intelligence.",
    },
  },
  {
    type: "title-card",
    id: "act9-1",
    durationMs: 5500,
    headline: "Sudar.",
    showLogo: true,
  },
  {
    type: "title-card",
    id: "act9-2",
    durationMs: 8200,
    headline: "Learns with you, for you.",
    showLogo: true,
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
