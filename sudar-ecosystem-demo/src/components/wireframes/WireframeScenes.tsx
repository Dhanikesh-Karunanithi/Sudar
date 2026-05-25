"use client";

import { motion } from "framer-motion";
import type { ModalityTab, SceneState } from "@/types/sceneState";
import { useCountUp } from "@/lib/demoMotion";
import { SudarLogoMark } from "@/components/brand/SudarLogoMark";
import { WireframeCinematicProvider, useWireframeCinematic } from "./WireframeCinematicContext";
import { MiniChip, PlaceholderLine, PulseHighlight, WireframeScreen } from "./WireframePrimitives";

import { CourseOutlinePanel } from "./CourseOutlinePanel";
import {
  LearnCourseRichScene,
  LearnDashboardRichScene,
  LearnMemoryRichScene,
  LearnTutorContextualScene,
  StudioCohortScene,
  StudioCreateSourcesScene,
  StudioIdBlueprintScene,
  StudioLiveEditorScene,
} from "./DemoScenesExtended";

export type WireframeSceneId =
  | "ecosystem-map"
  | "course-outline"
  | "studio-dashboard"
  | "studio-new-course"
  | "studio-create-sources"
  | "studio-id-blueprint"
  | "studio-live-editor"
  | "studio-editor"
  | "studio-integrations"
  | "studio-settings"
  | "intelligence-pipeline"
  | "sudar-vid"
  | "learn-dashboard"
  | "learn-course-viewer"
  | "learn-course-rich"
  | "learn-tutor"
  | "learn-tutor-contextual"
  | "learn-memory"
  | "learn-memory-rich"
  | "learn-settings"
  | "gamification"
  | "alp-flow"
  | "agents-run"
  | "analytics-compliance";

const sceneLabels: Record<WireframeSceneId, string> = {
  "ecosystem-map": "Sudar Ecosystem",
  "course-outline": "Sudar Studio · Course Outline",
  "studio-dashboard": "Sudar Studio",
  "studio-new-course": "Sudar Studio · New course",
  "studio-create-sources": "Sudar Studio · Create",
  "studio-id-blueprint": "Sudar Studio · Blueprint",
  "studio-live-editor": "Sudar Studio · Live editor",
  "studio-editor": "Sudar Studio · Editor",
  "studio-integrations": "Sudar Studio · Integrations",
  "studio-settings": "Sudar Studio · Settings",
  "intelligence-pipeline": "Sudar Intelligence",
  "sudar-vid": "SudarVid · Watch",
  "learn-dashboard": "Sudar Learn",
  "learn-course-viewer": "Sudar Learn · Course",
  "learn-course-rich": "Sudar Learn · Course",
  "learn-tutor": "Sudar Learn · Tutor",
  "learn-tutor-contextual": "Sudar Learn · Tutor",
  "learn-memory": "Sudar Learn · Memory",
  "learn-memory-rich": "Sudar Learn · Memory",
  "learn-settings": "Sudar Learn · Settings",
  gamification: "Sudar Learn · Engagement",
  "alp-flow": "ALP · Events",
  "agents-run": "Sudar Agents",
  "analytics-compliance": "Sudar Studio · Analytics",
};

const MODALITY_TABS: ModalityTab[] = ["Read", "Listen", "Watch", "Map", "Cards"];

function StudioSidebar({ active }: { active: string }) {
  const items = ["Courses", "Paths", "Analytics", "Integrations", "Governance", "Settings"];
  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#0d0d0d] p-3 space-y-1.5">
      {items.map((item) => (
        <div
          key={item}
          className={`rounded-lg px-3 py-2 text-[11px] ${
            item === active
              ? "bg-[#FF4500]/15 text-[#FF4500]/90 border border-[#FF4500]/20"
              : "text-zinc-600 border border-transparent"
          }`}
        >
          {item}
        </div>
      ))}
    </div>
  );
}

function EcosystemMapScene({ state }: { state: SceneState }) {
  const cinematic = useWireframeCinematic();
  const layers = [
    { id: "studio" as const, label: "Sudar Studio", sub: "Create · Paths · Analytics" },
    { id: "learn" as const, label: "Sudar Learn", sub: "Deliver · Modalities · Tutor" },
    { id: "intelligence" as const, label: "Sudar Intelligence", sub: "Adapt · Generate · TTS" },
    { id: "twin" as const, label: "Digital Learner Twin", sub: "Memory · Signals · Next best action" },
  ];
  return (
    <WireframeScreen label={sceneLabels["ecosystem-map"]} pulse>
      <div className="space-y-3 flex flex-col justify-center h-full">
        {layers.map((layer, i) => (
          <motion.div
            key={layer.id}
            initial={cinematic ? { opacity: 0, x: -16 } : false}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1, duration: 0.4, type: "spring", stiffness: 240 }}
            className={`rounded-xl border px-4 py-3 transition-colors ${
              state.ecosystemHighlight === layer.id
                ? "border-[#FF4500]/40 bg-[#FF4500]/[0.08]"
                : "border-white/[0.06] bg-[#0d0d0d]"
            }`}
          >
            <p className="text-[12px] text-white/85 font-medium">{layer.label}</p>
            <p className="text-[10px] text-zinc-600 mt-1">{layer.sub}</p>
          </motion.div>
        ))}
        <motion.div
          className="flex items-center justify-center gap-2 mt-2"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ repeat: Infinity, duration: 2.5 }}
        >
          <span className="text-[9px] font-mono text-[#FF4500]/50">
            every interaction → updates the Twin
          </span>
          <span className="text-[#FF4500]/40 text-xs">↺</span>
        </motion.div>
        <p className="text-center text-[10px] font-mono text-[#FF4500]/50 pt-2">
          Learns with you, for you.
        </p>
      </div>
    </WireframeScreen>
  );
}

function CourseOutlineScene({ state }: { state: SceneState }) {
  return (
    <WireframeScreen label={sceneLabels["course-outline"]}>
      <CourseOutlinePanel state={state} />
    </WireframeScreen>
  );
}

function StudioDashboardScene({ state }: { state: SceneState }) {
  const isPaths = state.studioView === "paths";
  return (
    <WireframeScreen label={sceneLabels["studio-dashboard"]} pulse={state.highlightId === "new-course"}>
      <div className="grid grid-cols-1 lg:grid-cols-[160px_1fr] gap-4">
        <StudioSidebar active={isPaths ? "Paths" : state.studioSidebarActive ?? "Courses"} />
        <div className="space-y-4">
          {!isPaths ? (
            <>
              <div className="flex flex-wrap gap-2">
                <PulseHighlight active={state.highlightId === "new-course"}>
                  <span className="text-[11px] text-white/80 font-medium">+ New course</span>
                </PulseHighlight>
                <MiniChip active={state.highlightId === "source-doc"}>DOCUMENT</MiniChip>
                <MiniChip active={state.highlightId === "source-idea"}>IDEA</MiniChip>
                <MiniChip active={state.highlightId === "source-business"}>BUSINESS NEED</MiniChip>
                <MiniChip>COHORT</MiniChip>
                <MiniChip>LEARNER CONTEXT</MiniChip>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                {["Safety onboarding", "Product 101", "Compliance Q3"].map((t) => (
                  <div key={t} className="rounded-xl border border-white/[0.06] bg-[#0d0d0d] p-4">
                    <PlaceholderLine w="w-[70%]" />
                    <div className="mt-3 h-8 rounded-lg bg-white/[0.04]" />
                    <p className="mt-2 text-[10px] text-zinc-600">{t}</p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <PulseHighlight active={state.highlightId === "path-card"}>
              <p className="text-[10px] font-mono text-zinc-600 uppercase mb-2">Learning path</p>
              <div className="rounded-xl border border-white/[0.06] bg-[#0d0d0d] p-4">
                <p className="text-[11px] text-white/80">Retail compliance Q3</p>
                <p className="text-[10px] text-zinc-600 mt-2">3 courses · Due Aug 15</p>
                <div className="mt-3 flex gap-2">
                  <MiniChip active>MANDATORY</MiniChip>
                  <MiniChip>12 LEARNERS</MiniChip>
                </div>
              </div>
            </PulseHighlight>
          )}
        </div>
      </div>
    </WireframeScreen>
  );
}

function StudioNewCourseScene({ state }: { state: SceneState }) {
  return (
    <WireframeScreen label={sceneLabels["studio-new-course"]}>
      <div className="grid lg:grid-cols-2 gap-4">
        <PulseHighlight active={state.highlightId === "drop-zone"}>
          <p className="text-[10px] font-mono text-[#FF4500]/70 uppercase tracking-widest mb-2">Source</p>
          <div className="h-28 rounded-xl border border-dashed border-white/[0.12] flex items-center justify-center text-[11px] text-zinc-500">
            Drop PDF or paste URL
          </div>
        </PulseHighlight>
        <div className="rounded-xl border border-white/[0.06] bg-[#0d0d0d] p-4">
          <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest mb-3">AI outline</p>
          {["Module 1 · Intro", "Module 2 · Practice", "Module 3 · Quiz"].map((m) => (
            <div key={m} className="mb-2 rounded-lg border border-white/[0.05] px-3 py-2 text-[11px] text-zinc-500">
              {m}
            </div>
          ))}
          <motion.div className="mt-3 h-2 rounded-full bg-white/[0.06] overflow-hidden" initial={false}>
            <motion.div
              className="h-full bg-[#FF4500]/50"
              animate={{ width: ["12%", "78%", "100%"] }}
              transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
            />
          </motion.div>
        </div>
      </div>
    </WireframeScreen>
  );
}

function StudioEditorScene({ state }: { state: SceneState }) {
  const modIdx = state.activeModuleIndex ?? 1;
  return (
    <WireframeScreen label={sceneLabels["studio-editor"]}>
      <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-4">
        <div className="space-y-2">
          {["01 Intro", "02 Core", "03 Quiz"].map((s, i) => (
            <div
              key={s}
              className={`rounded-lg px-3 py-2 text-[11px] border ${
                i === modIdx
                  ? "border-[#FF4500]/30 bg-[#FF4500]/[0.06] text-zinc-400"
                  : "border-white/[0.05] text-zinc-600"
              }`}
            >
              {s}
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-[#0d0d0d] p-4">
          <div className="flex gap-2 mb-4">
            <MiniChip active={state.highlightId === "persona"}>PERSONA</MiniChip>
            <MiniChip>TEXT</MiniChip>
            <MiniChip>QUIZ</MiniChip>
          </div>
          <PlaceholderLine w="w-[90%]" />
          <div className="mt-2">
            <PlaceholderLine w="w-[85%]" />
          </div>
          <div className="mt-4 h-20 rounded-xl bg-white/[0.03] border border-white/[0.06]" />
        </div>
      </div>
    </WireframeScreen>
  );
}

function IntelligencePipelineScene({ state }: { state: SceneState }) {
  const nodes = ["Tutor RAG", "Content gen", "TTS / Audio", "Adaptive"];
  return (
    <WireframeScreen label={sceneLabels["intelligence-pipeline"]} pulse>
      <div className="grid grid-cols-2 gap-3">
        {nodes.map((n, i) => (
          <PulseHighlight key={n} active={state.highlightId === "generate" && i === 1}>
            <p className="text-[11px] text-white/80">{n}</p>
            <p className="text-[10px] text-zinc-600 mt-1">FastAPI · Python</p>
          </PulseHighlight>
        ))}
      </div>
      <p className="mt-4 text-center text-[10px] font-mono text-zinc-600">
        Called by Studio & Learn via SUDAR_INTELLIGENCE_URL
      </p>
    </WireframeScreen>
  );
}

function SudarVidScene({ state }: { state: SceneState }) {
  return (
    <WireframeScreen label={sceneLabels["sudar-vid"]}>
      <div className="rounded-xl border border-white/[0.06] bg-[#0d0d0d] p-3 mb-3">
        <div className="aspect-video rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-[11px] text-zinc-600">
          Slide preview
        </div>
      </div>
      <PulseHighlight active={state.highlightId === "timeline"}>
        <p className="text-[10px] font-mono text-zinc-600 uppercase mb-2">Timeline</p>
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`flex-1 h-8 rounded border ${
                s === 2 ? "border-[#FF4500]/40 bg-[#FF4500]/10" : "border-white/[0.06]"
              }`}
            />
          ))}
        </div>
      </PulseHighlight>
    </WireframeScreen>
  );
}

function StudioIntegrationsScene({ state }: { state: SceneState }) {
  return (
    <WireframeScreen label={sceneLabels["studio-integrations"]} pulse>
      <div className="grid lg:grid-cols-2 gap-4">
        <PulseHighlight active={state.integrationsHighlight === "alp"}>
          <p className="text-[11px] text-white/80 font-medium mb-2">ALP API key</p>
          <div className="font-mono text-[10px] text-zinc-500 break-all">sk_alp_••••••••••••</div>
          <div className="mt-3 flex gap-2">
            <MiniChip active={state.highlightId === "copy-key"}>COPY</MiniChip>
            <MiniChip>ROTATE</MiniChip>
          </div>
        </PulseHighlight>
        <PulseHighlight active={state.integrationsHighlight === "mcp"}>
          <p className="text-[11px] text-white/80 font-medium mb-2">MCP / ChatGPT</p>
          <PlaceholderLine w="w-full" />
          <div className="mt-2">
            <PlaceholderLine w="w-[80%]" />
          </div>
          <div className="mt-3">
            <MiniChip active={state.highlightId === "mcp-json"}>MCP.JSON</MiniChip>
          </div>
        </PulseHighlight>
      </div>
    </WireframeScreen>
  );
}

function StudioSettingsScene({ state }: { state: SceneState }) {
  if (state.highlightId === "cohort") {
    return <StudioCohortScene state={state} />;
  }
  const rows = ["Localization", "AI personalization", "Tutor memory cadence", "Compliance"];
  const hi = state.settingsHighlightIndex ?? 1;
  return (
    <WireframeScreen label={sceneLabels["studio-settings"]}>
      <div className="space-y-3 max-w-md">
        {rows.map((row, i) => (
          <div
            key={row}
            className={`flex items-center justify-between rounded-lg border px-4 py-3 ${
              i === hi ? "border-[#FF4500]/25 bg-[#FF4500]/[0.04]" : "border-white/[0.06]"
            }`}
          >
            <span className="text-[11px] text-zinc-500">{row}</span>
            <span className="w-8 h-4 rounded-full bg-[#FF4500]/30 border border-[#FF4500]/40" />
          </div>
        ))}
      </div>
    </WireframeScreen>
  );
}

function LearnDashboardScene({ state }: { state: SceneState }) {
  return (
    <WireframeScreen label={sceneLabels["learn-dashboard"]}>
      <div className="grid sm:grid-cols-2 gap-4">
        <PulseHighlight active={state.highlightId === "continue"}>
          <p className="text-[10px] font-mono text-zinc-600 uppercase mb-2">Continue</p>
          <PlaceholderLine w="w-[75%]" />
          <div className="mt-3 h-2 rounded-full bg-white/[0.06]">
            <div className="h-full w-[45%] rounded-full bg-[#FF4500]/50" />
          </div>
        </PulseHighlight>
        <PulseHighlight active={state.highlightId === "nba"}>
          <p className="text-[10px] font-mono text-[#FF4500]/60 uppercase mb-2">Sudar suggests</p>
          <PlaceholderLine w="w-[88%]" />
          <div className="mt-3 flex flex-wrap gap-2">
            <MiniChip active>CONTINUE</MiniChip>
            <MiniChip>REVIEW</MiniChip>
          </div>
        </PulseHighlight>
      </div>
    </WireframeScreen>
  );
}

function LearnCourseViewerScene({ state }: { state: SceneState }) {
  const activeTab = state.activeTab ?? "Read";
  return (
    <WireframeScreen label={sceneLabels["learn-course-viewer"]}>
      <div className="flex flex-wrap gap-2 mb-4">
        {MODALITY_TABS.map((tab) => (
          <span
            key={tab}
            className={`text-[10px] font-mono px-3 py-1 rounded-full border ${
              tab === activeTab
                ? "border-[#FF4500]/40 bg-[#FF4500]/10 text-[#FF4500]/80"
                : "border-white/[0.06] text-zinc-600"
            }`}
          >
            {tab.toUpperCase()}
          </span>
        ))}
      </div>
      <div className="grid lg:grid-cols-[1fr_200px] gap-4">
        <div className="rounded-xl border border-white/[0.06] bg-[#0d0d0d] p-4">
          <PlaceholderLine w="w-[65%]" />
          <div className="mt-3 space-y-2">
            <PlaceholderLine w="w-full" />
            <PlaceholderLine w="w-[92%]" />
          </div>
        </div>
        <div className="rounded-xl border border-[#FF4500]/12 bg-[#FF4500]/[0.03] p-3">
          <p className="text-[10px] text-[#FF4500]/60 font-mono mb-2">TUTOR</p>
          <PlaceholderLine w="w-full" />
        </div>
      </div>
    </WireframeScreen>
  );
}

function LearnTutorScene({ state }: { state: SceneState }) {
  return (
    <WireframeScreen label={sceneLabels["learn-tutor"]} pulse>
      <div className="max-w-sm ml-auto rounded-2xl border border-white/[0.08] bg-[#0d0d0d] p-4 shadow-lg">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-xl bg-[#FF4500]/20 flex items-center justify-center overflow-hidden shrink-0">
            <SudarLogoMark size={22} variant="on-dark" />
          </div>
          <span className="text-[11px] text-white/80">Sudar</span>
        </div>
        <div className="space-y-2 mb-3">
          <div className="rounded-lg bg-white/[0.04] p-2">
            <PlaceholderLine w="w-[90%]" />
          </div>
          <PulseHighlight active={!!state.tutorChipHighlight}>
            <PlaceholderLine w="w-[70%]" />
          </PulseHighlight>
        </div>
        <div className="flex flex-wrap gap-2">
          <MiniChip active={state.tutorChipHighlight === "explain"}>EXPLAIN</MiniChip>
          <MiniChip active={state.tutorChipHighlight === "quiz"}>QUIZ ME</MiniChip>
        </div>
      </div>
    </WireframeScreen>
  );
}

function LearnMemoryScene({ state }: { state: SceneState }) {
  return (
    <WireframeScreen label={sceneLabels["learn-memory"]}>
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="rounded-xl border border-white/[0.06] bg-[#0d0d0d] p-4">
          <p className="text-[10px] font-mono text-zinc-600 uppercase mb-3">Languages</p>
          <div className="space-y-2">
            <div className="rounded-lg border border-white/[0.06] px-3 py-2 text-[11px] text-zinc-500">
              UI · English
            </div>
            <div className="rounded-lg border border-white/[0.06] px-3 py-2 text-[11px] text-zinc-500">
              Content · English
            </div>
          </div>
        </div>
        <PulseHighlight active={state.highlightId === "memory-cadence"}>
          <p className="text-[10px] font-mono text-[#FF4500]/60 uppercase mb-3">Digital Learner Twin</p>
          <div className="text-[11px] text-zinc-500 space-y-1">
            <p>Modality scores · 0.82 video</p>
            <p>LLM cadence · Weekly</p>
            <p>Known concepts · 12</p>
          </div>
        </PulseHighlight>
      </div>
    </WireframeScreen>
  );
}

function LearnSettingsScene({ state }: { state: SceneState }) {
  return (
    <WireframeScreen label={sceneLabels["learn-settings"]}>
      <div className="max-w-md space-y-3">
        <PulseHighlight active={state.highlightId === "sound-slider"}>
          <p className="text-[11px] text-white/80 mb-2">Notification sounds</p>
          <div className="h-2 rounded-full bg-white/[0.08]">
            <div className="h-full w-2/3 rounded-full bg-[#FF4500]/60" />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <MiniChip>TASK</MiniChip>
            <MiniChip>REPLY</MiniChip>
            <MiniChip>TOAST</MiniChip>
          </div>
        </PulseHighlight>
      </div>
    </WireframeScreen>
  );
}

function GamificationScene({ state }: { state: SceneState }) {
  return (
    <WireframeScreen label={sceneLabels.gamification}>
      <div className="grid sm:grid-cols-3 gap-3">
        <div className="rounded-xl border border-white/[0.06] bg-[#0d0d0d] p-3 text-center">
          <p className="text-[10px] text-zinc-600 uppercase">Streak</p>
          <p className="text-lg text-[#FF4500]/80 font-mono mt-1">7</p>
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-[#0d0d0d] p-3 text-center">
          <p className="text-[10px] text-zinc-600 uppercase">Coins</p>
          <p className="text-lg text-white/80 font-mono mt-1">240</p>
        </div>
        <PulseHighlight active={state.highlightId === "quest"}>
          <p className="text-[10px] text-zinc-600 uppercase">Quest</p>
          <p className="text-[11px] text-white/70 mt-2">Finish module 3</p>
        </PulseHighlight>
      </div>
    </WireframeScreen>
  );
}

function AlpFlowScene(_props: { state: SceneState }) {
  const events = [
    { label: "module_complete", dot: "bg-emerald-400" },
    { label: "quiz_attempt", dot: "bg-blue-400" },
    { label: "video_pause", dot: "bg-amber-400" },
  ];
  const affinities = [
    { label: "Video", pct: 82, color: "bg-violet-500" },
    { label: "Text", pct: 64, color: "bg-blue-500" },
    { label: "Audio", pct: 51, color: "bg-emerald-500" },
  ];

  return (
    <WireframeScreen label={sceneLabels["alp-flow"]}>
      <div className="flex flex-col sm:flex-row items-stretch justify-center gap-4 py-2">
        <div className="flex-1 rounded-xl border border-white/[0.06] bg-[#0d0d0d] p-3 min-w-0">
          <p className="text-[10px] font-mono text-zinc-500 uppercase mb-2">Your LMS</p>
          <p className="text-[11px] text-white/70 mb-3">Moodle · Canvas · Blackboard</p>
          <div className="space-y-1.5">
            {events.map((e, i) => (
              <motion.div
                key={e.label}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.4, duration: 0.35 }}
                className="rounded border border-white/[0.05] px-2 py-1 font-mono text-[9px] flex items-center gap-2"
              >
                <span className={`w-1.5 h-1.5 rounded-full ${e.dot}`} />
                <span className="text-zinc-500">{e.label}</span>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-center justify-center gap-1 self-center shrink-0">
          <motion.span
            className="text-[#FF4500]/60 font-mono text-[9px]"
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          >
            POST /api/alp/events
          </motion.span>
          <span className="text-[#FF4500]/50 text-lg">→</span>
          <span className="text-[9px] font-mono text-zinc-600">47 events/day</span>
        </div>

        <div className="flex-1 rounded-xl border border-[#FF4500]/25 bg-[#FF4500]/[0.06] p-3 min-w-0">
          <p className="text-[10px] font-mono text-[#FF4500]/60 uppercase mb-2">Digital Learner Twin</p>
          <p className="text-[11px] text-zinc-400 mb-3">Modality affinity</p>
          <div className="space-y-2">
            {affinities.map((a) => (
              <div key={a.label}>
                <div className="flex justify-between text-[9px] text-zinc-500 mb-0.5">
                  <span>{a.label}</span>
                  <span>{a.pct}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${a.color}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${a.pct}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </WireframeScreen>
  );
}

function AgentsRunScene({ state }: { state: SceneState }) {
  return (
    <WireframeScreen label={sceneLabels["agents-run"]} pulse={state.highlightId === "run-agent"}>
      <div className="space-y-3">
        <PulseHighlight active={state.highlightId === "run-agent"}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-white/80">Summarize cohort progress</span>
            <MiniChip active>RUN</MiniChip>
          </div>
        </PulseHighlight>
        <div className="rounded-lg border border-white/[0.06] px-3 py-2 font-mono text-[10px] text-zinc-600">
          plan → tool: learner_pulse → artefact
        </div>
        <PlaceholderLine w="w-[85%]" />
      </div>
    </WireframeScreen>
  );
}

function AnalyticsComplianceScene({ state }: { state: SceneState }) {
  const cinematic = useWireframeCinematic();
  const learners = useCountUp(18, 900, cinematic);
  const complete = useCountUp(14, 900, cinematic);
  const atRisk = useCountUp(2, 700, cinematic);

  const rows = [
    { name: "Marcus K.", status: "Complete", risk: false, certified: true },
    { name: "Sarah L.", status: "In progress", risk: false, certified: false },
    { name: "Team B · 4", status: "At risk", risk: true, certified: false },
  ];

  const kpis = [
    { label: "Learners", value: learners, highlight: false },
    { label: "Complete", value: complete, highlight: false },
    { label: "At risk", value: atRisk, highlight: true },
  ];

  return (
    <WireframeScreen label={sceneLabels["analytics-compliance"]}>
      <div className="flex flex-wrap gap-3 mb-4 items-center">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className={`flex-1 min-w-[72px] rounded-lg border px-3 py-2 text-center ${
              kpi.highlight ? "border-[#FF4500]/30 bg-[#FF4500]/[0.04]" : "border-white/[0.06]"
            }`}
          >
            <p
              className={`text-[13px] font-mono font-bold ${
                kpi.highlight ? "text-[#FF4500]/80" : "text-white/80"
              }`}
            >
              {kpi.value}
            </p>
            <p className="text-[9px] text-zinc-600 uppercase mt-0.5">{kpi.label}</p>
          </div>
        ))}
        <div className="flex items-center gap-1.5 px-2">
          <motion.span
            className="w-2 h-2 rounded-full bg-emerald-400"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ repeat: Infinity, duration: 1.2 }}
          />
          <span className="text-[9px] text-zinc-500 font-mono">Live</span>
        </div>
      </div>

      <div className="space-y-2">
        {rows.map((row) => (
          <div
            key={row.name}
            className={`flex items-center justify-between rounded-lg border px-4 py-2 ${
              row.risk && state.highlightId === "at-risk"
                ? "border-[#FF4500]/30 bg-[#FF4500]/[0.06]"
                : "border-white/[0.06]"
            }`}
          >
            <span className="text-[11px] text-zinc-500">{row.name}</span>
            <div className="flex items-center gap-2">
              {row.certified && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono"
                >
                  ✓ Certified
                </motion.span>
              )}
              <span
                className={`text-[10px] font-mono ${
                  row.risk ? "text-[#FF4500]/80" : "text-zinc-600"
                }`}
              >
                {row.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </WireframeScreen>
  );
}

type SceneProps = { state: SceneState };

const sceneComponents: Record<WireframeSceneId, (props: SceneProps) => React.JSX.Element> = {
  "ecosystem-map": EcosystemMapScene,
  "course-outline": CourseOutlineScene,
  "studio-dashboard": StudioDashboardScene,
  "studio-new-course": StudioNewCourseScene,
  "studio-create-sources": StudioCreateSourcesScene,
  "studio-id-blueprint": StudioIdBlueprintScene,
  "studio-live-editor": StudioLiveEditorScene,
  "studio-editor": StudioEditorScene,
  "studio-integrations": StudioIntegrationsScene,
  "studio-settings": StudioSettingsScene,
  "intelligence-pipeline": IntelligencePipelineScene,
  "sudar-vid": SudarVidScene,
  "learn-dashboard": LearnDashboardRichScene,
  "learn-course-viewer": LearnCourseViewerScene,
  "learn-course-rich": LearnCourseRichScene,
  "learn-tutor": LearnTutorScene,
  "learn-tutor-contextual": LearnTutorContextualScene,
  "learn-memory": LearnMemoryScene,
  "learn-memory-rich": LearnMemoryRichScene,
  "learn-settings": LearnSettingsScene,
  gamification: GamificationScene,
  "alp-flow": AlpFlowScene,
  "agents-run": AgentsRunScene,
  "analytics-compliance": AnalyticsComplianceScene,
};

export function WireframeScene({
  id,
  state,
  cinematic,
}: {
  id: WireframeSceneId;
  state: SceneState;
  cinematic?: boolean;
}) {
  const Component = sceneComponents[id];
  return (
    <WireframeCinematicProvider
      cinematic={cinematic}
      deviceLayout={state.deviceLayout ?? "desktop"}
    >
      <Component state={state} />
    </WireframeCinematicProvider>
  );
}
