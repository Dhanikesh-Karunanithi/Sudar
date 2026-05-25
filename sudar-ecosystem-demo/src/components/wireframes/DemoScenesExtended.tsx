"use client";

import { motion } from "framer-motion";
import type { GenerationSource, ModalityTab, SceneState } from "@/types/sceneState";
import { useAnimatedProgress, useTypingText } from "@/lib/demoMotion";
import { useDeviceLayout, useWireframeCinematic } from "./WireframeCinematicContext";
import { BloomBlueprintStrip } from "./BloomBlueprintStrip";
import { CourseBlockCanvas } from "./CourseBlockCanvas";
import { LessonVideoThumb } from "./LessonVideoThumb";
import { LearnMobileTabBar, LearnNavChrome } from "./LearnNavChrome";
import { MiniChip, PulseHighlight, WireframeScreen } from "./WireframePrimitives";
import { TutorConversationPanel } from "./TutorConversationPanel";

const SOURCES: { id: GenerationSource; label: string }[] = [
  { id: "document", label: "Document" },
  { id: "idea", label: "Idea / prompt" },
  { id: "business", label: "Business need" },
  { id: "cohort", label: "Cohort" },
  { id: "learner", label: "Learner context" },
];

const SARAH_PROMPT =
  "Create fun ways to manage an office, taught by Michael Scott from The Office. Engaging, relatable, but learners still master real management basics.";

const BUSINESS_NEED = "Reduce manager escalations in Q3 · New hire store managers";

const OFFICE_MODULES = [
  "World's Best Boss 101: Intro…",
  "Dunder Mifflin Basics…",
  "Managing Your Dwight…",
  "Scranton Strangler of Productivity…",
  "That's What She Said: Conflict…",
];

const MODALITY_TABS: ModalityTab[] = ["Read", "Listen", "Watch", "Map", "Cards"];

const UNCERTAINTY_TAGS = [
  "delegation on video",
  "conflict resolution",
  "Professional Foundation",
];

const ENGAGED_TAGS = [
  "group dynamics",
  "management basics",
  "empathy",
  "Python basics",
];

export function StudioCreateSourcesScene({ state }: { state: SceneState }) {
  const source = state.generationSource ?? "idea";
  const cinematic = useWireframeCinematic();
  const typedPrompt = useTypingText(
    SARAH_PROMPT,
    cinematic && (source === "idea" || state.highlightId === "prompt")
  );

  return (
    <WireframeScreen label="Sudar Studio · New course" pulse={!!state.highlightId}>
      <p className="text-[11px] text-white/70 font-medium mb-1">Somehow I manage</p>
      <p className="text-[10px] text-zinc-600 mb-4">Published · Beginner · Adaptive Learning</p>
      <div className="flex flex-wrap gap-2 mb-4">
        {SOURCES.map((s) => (
          <MiniChip key={s.id} active={source === s.id}>
            {s.label.toUpperCase()}
          </MiniChip>
        ))}
      </div>
      <PulseHighlight active={source === "idea" || state.highlightId === "prompt"}>
        <p className="text-[10px] font-mono text-[#FF4500]/70 uppercase mb-2">AI prompt</p>
        <div className="rounded-xl border border-white/[0.08] bg-[#0d0d0d] p-3 min-h-[72px]">
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            {typedPrompt}
            {cinematic && typedPrompt.length < SARAH_PROMPT.length && (
              <span className="inline-block w-0.5 h-3 bg-[#FF4500]/80 ml-0.5 align-middle animate-pulse" />
            )}
          </p>
        </div>
      </PulseHighlight>
      {source === "business" && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 rounded-xl border border-[#FF4500]/20 bg-[#FF4500]/[0.04] p-3"
        >
          <p className="text-[10px] text-zinc-600 uppercase mb-1">Business need</p>
          <p className="text-[11px] text-zinc-400">{BUSINESS_NEED}</p>
        </motion.div>
      )}
      <div className="mt-4 grid sm:grid-cols-3 gap-2">
        {OFFICE_MODULES.slice(0, 3).map((m, i) => (
          <motion.div
            key={m}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 + i * 0.12 }}
            className="rounded-lg border border-white/[0.06] px-2 py-2 text-[10px] text-zinc-600"
          >
            {m}
          </motion.div>
        ))}
      </div>
    </WireframeScreen>
  );
}

export function StudioIdBlueprintScene({ state }: { state: SceneState }) {
  return (
    <WireframeScreen label="Sudar Studio · Instructional blueprint">
      <div className="grid lg:grid-cols-[1fr_220px] gap-4 h-full">
        <div className="rounded-xl border border-white/[0.06] bg-[#0d0d0d] p-4">
          <p className="text-[10px] text-zinc-600 uppercase mb-2">Generated outline · 5 modules</p>
          {OFFICE_MODULES.map((m, i) => (
            <motion.div
              key={m}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08, duration: 0.35, type: "spring", stiffness: 260 }}
              className={`mb-2 rounded-lg px-3 py-2 text-[11px] border ${
                i === 0
                  ? "border-[#FF4500]/25 bg-[#FF4500]/[0.04] text-zinc-400"
                  : "border-white/[0.05] text-zinc-600"
              }`}
            >
              {m}
            </motion.div>
          ))}
        </div>
        <BloomBlueprintStrip state={state} />
      </div>
    </WireframeScreen>
  );
}

export function StudioLiveEditorScene({ state }: { state: SceneState }) {
  const modIdx = state.activeModuleIndex ?? 0;
  const adaptive = state.adaptiveLearningOn !== false;
  const cinematic = useWireframeCinematic();
  const blockCount = state.visibleBlocks?.length ?? 0;
  const showGenerating =
    cinematic && state.uiMotion === "slide-in" && blockCount > 0 && blockCount < 6;

  return (
    <WireframeScreen label="Sudar Studio · Editor">
      <div className="grid grid-cols-1 lg:grid-cols-[180px_1fr] gap-4 h-full">
        <div className="space-y-1.5">
          <p className="text-[9px] font-mono text-zinc-600 uppercase mb-2">Jump to module</p>
          {OFFICE_MODULES.map((m, i) => (
            <div
              key={m}
              className={`rounded-lg px-2 py-1.5 text-[10px] border truncate ${
                i === modIdx
                  ? "border-[#FF4500]/30 bg-[#FF4500]/[0.06] text-zinc-400"
                  : "border-white/[0.05] text-zinc-600"
              }`}
            >
              {i + 1}. {m}
            </div>
          ))}
        </div>
        <div className="space-y-3">
          {showGenerating && (
            <motion.div
              className="flex items-center gap-2 text-[10px] text-[#FF4500]/70 font-mono"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 1.2 }}
            >
              <span className="w-3 h-3 rounded-full border-2 border-[#FF4500]/40 border-t-[#FF4500] animate-spin" />
              Generating module blocks…
            </motion.div>
          )}
          <div className="flex flex-wrap gap-3 text-[10px]">
            <label className="flex items-center gap-1.5 text-zinc-500">
              <span className="w-3 h-3 rounded border border-emerald-500/50 bg-emerald-500/20" /> Include
              video
            </label>
            <label className="flex items-center gap-1.5 text-zinc-500">
              <span className="w-3 h-3 rounded border border-emerald-500/50 bg-emerald-500/20" /> Include
              podcast
            </label>
          </div>
          <PulseHighlight active={adaptive && state.highlightId === "adaptive"}>
            <div className="flex items-center justify-between rounded-lg border border-violet-500/20 bg-violet-500/5 px-3 py-2">
              <span className="text-[11px] text-zinc-400">Adaptive Learning</span>
              <MiniChip active>ON</MiniChip>
            </div>
            <p className="text-[9px] text-zinc-600 mt-1">
              Personalized welcome per learner on enrollment
            </p>
          </PulseHighlight>
          <CourseBlockCanvas
            state={state}
            highlightAddBlock={state.highlightId === "add-block"}
          />
          {state.highlightId === "persona" && (
            <div className="flex gap-2 flex-wrap">
              <MiniChip active>PLATFORM DEFAULT</MiniChip>
              <MiniChip>PRECISION</MiniChip>
              <MiniChip>EDITORIAL</MiniChip>
            </div>
          )}
        </div>
      </div>
    </WireframeScreen>
  );
}

function useIsMobileLearn(state: SceneState) {
  const ctxLayout = useDeviceLayout();
  return (state.deviceLayout ?? ctxLayout) === "mobile";
}

export function LearnCourseRichScene({ state }: { state: SceneState }) {
  const isMobile = useIsMobileLearn(state);
  const activeTab = state.activeTab ?? "Watch";
  const targetProgress = state.videoProgress ?? 0;
  const cinematic = useWireframeCinematic();
  const animatedProgress = useAnimatedProgress(
    targetProgress,
    cinematic && !!state.animateVideo,
    Math.max(0, targetProgress - 18)
  );
  const displayProgress = state.animateVideo ? animatedProgress : targetProgress;
  const accordionOpen = state.accordionExpanded ?? false;
  const flipped = state.flipcardFlipped ?? false;
  const timestampSec = Math.round((displayProgress / 100) * 180);

  return (
    <WireframeScreen label="Sudar Learn · Somehow I manage" variant="learn">
      <LearnNavChrome state={{ ...state, learnNavActive: "Courses" }} />
      <p className="text-[12px] font-semibold text-zinc-900 mb-3">
        World&apos;s Best Boss 101: Introduction to Management
      </p>
      <div className={`flex gap-1.5 mb-3 ${isMobile ? "overflow-x-auto pb-1" : "flex-wrap gap-2"}`}>
        {MODALITY_TABS.map((tab) => (
          <span
            key={tab}
            className={`shrink-0 text-[9px] font-medium px-2.5 py-1 rounded-full border ${
              tab === activeTab
                ? "border-violet-500 bg-violet-600 text-white"
                : "border-zinc-200 text-zinc-500 bg-white"
            }`}
          >
            {tab}
          </span>
        ))}
      </div>
      <div className="space-y-3 flex-1 flex flex-col min-h-0">
        {activeTab === "Watch" && (
          <PulseHighlight active={displayProgress > 0} variant="learn">
            <LessonVideoThumb sizes="500px">
              {displayProgress > 0 && displayProgress < 100 && (
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <span className="text-[10px] text-white/90 bg-black/50 px-2 py-1 rounded">
                    {state.animateVideo ? "Playing" : "Paused"} · {displayProgress}%
                  </span>
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-zinc-700">
                <motion.div
                  className="h-full bg-violet-500"
                  style={{ width: `${displayProgress}%` }}
                  layout
                />
              </div>
              <span className="absolute bottom-2 right-2 z-10 text-[9px] font-mono text-white/70 bg-black/40 px-1.5 py-0.5 rounded">
                {Math.floor(timestampSec / 60)}:{String(timestampSec % 60).padStart(2, "0")}
              </span>
            </LessonVideoThumb>
          </PulseHighlight>
        )}
        {activeTab !== "Watch" && (
          <div className="rounded-xl border border-zinc-200 p-3 text-[11px] text-zinc-600">
            {activeTab} modality, same module content
          </div>
        )}
        <div
          className={`rounded-xl border px-3 py-2 transition-colors ${
            accordionOpen
              ? "border-violet-300 bg-violet-50"
              : "border-zinc-200 bg-zinc-50"
          }`}
        >
          <p className="text-[11px] font-medium text-zinc-800">
            {accordionOpen ? "▼" : "▶"} Delegation vs. micromanagement
          </p>
          {accordionOpen && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-2 text-[10px] text-zinc-600"
            >
              Great managers delegate outcomes, not just tasks. Michael… tries.
            </motion.p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {["Empathy", "Accountability"].map((label, i) => (
            <motion.div
              key={label}
              animate={
                flipped && i === 0
                  ? { rotateY: 180, scale: 1.02 }
                  : { rotateY: 0, scale: 1 }
              }
              transition={{ type: "spring", stiffness: 200 }}
              className={`h-16 rounded-xl border flex items-center justify-center text-[10px] ${
                flipped && i === 0
                  ? "border-violet-400 bg-violet-100 text-violet-800"
                  : "border-zinc-200 bg-white text-zinc-500"
              }`}
              style={{ transformStyle: "preserve-3d" }}
            >
              {flipped && i === 0 ? "Listen first, then decide" : label}
            </motion.div>
          ))}
        </div>
      </div>
      <LearnMobileTabBar state={state} />
    </WireframeScreen>
  );
}

export function LearnTutorContextualScene({ state }: { state: SceneState }) {
  const isMobile = useIsMobileLearn(state);

  return (
    <WireframeScreen label="Sudar Learn · Tutor" variant="learn">
      <LearnNavChrome state={state} />
      <div
        className={`flex-1 min-h-0 ${
          isMobile
            ? "flex flex-col gap-3"
            : "grid lg:grid-cols-[1fr_280px] gap-4 items-end min-h-[200px] h-full"
        }`}
      >
        <LessonVideoThumb
          sizes="300px"
          dimmed
          overlayLabel="On screen: delegation scene"
          className={isMobile ? "w-full opacity-90" : "opacity-60"}
        />
        <TutorConversationPanel state={state} />
      </div>
      <LearnMobileTabBar state={state} />
    </WireframeScreen>
  );
}

export function LearnMemoryRichScene({ state }: { state: SceneState }) {
  const hi = state.memoryHighlight ?? "twin";
  const isMobile = useIsMobileLearn(state);

  return (
    <WireframeScreen label="Sudar Learn · Memory" variant="learn">
      <LearnNavChrome state={{ ...state, learnNavActive: "Memory" }} />
      <div className="rounded-2xl bg-gradient-to-r from-violet-600 to-violet-700 px-4 py-5 mb-4 text-white">
        <p className="text-[14px] font-bold">Sudar&apos;s Memory</p>
        <p className="text-[11px] text-violet-100 mt-1 opacity-90">
          Built from 60 interactions, your style and context personalize every conversation.
        </p>
      </div>
      <div className={`grid gap-2 mb-4 ${isMobile ? "grid-cols-1" : "sm:grid-cols-3"}`}>
        {["Adaptive path", "Digital Learner Twin", "Concepts engaged"].map((title, i) => (
          <PulseHighlight key={title} active={hi === "twin" && i === 1} variant="learn">
            <p className="text-[10px] font-semibold text-zinc-800">{title}</p>
            <p className="text-[9px] text-zinc-500 mt-1">PROFILE · PATH · ACADEMIC</p>
          </PulseHighlight>
        ))}
      </div>
      <PulseHighlight active={hi === "uncertainty"} variant="learn">
        <p className="text-[10px] font-medium text-amber-800 mb-2">Areas where you&apos;ve shown uncertainty</p>
        <div className="flex flex-wrap gap-1.5">
          {UNCERTAINTY_TAGS.map((t) => (
            <span
              key={t}
              className="text-[9px] px-2 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200"
            >
              {t}
            </span>
          ))}
        </div>
      </PulseHighlight>
      <div className="mt-3">
        <p className="text-[10px] font-medium text-emerald-800 mb-2">Concepts you&apos;ve engaged with</p>
        <div className="flex flex-wrap gap-1.5">
          {ENGAGED_TAGS.map((t) => (
            <span
              key={t}
              className="text-[9px] px-2 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200"
            >
              {t}
            </span>
          ))}
        </div>
      </div>
      {hi === "context" && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 rounded-xl border border-violet-200 bg-violet-50/50 p-3"
        >
          <p className="text-[10px] font-semibold text-zinc-800 mb-2">Your context</p>
          <p className="text-[10px] text-zinc-600">Background · Learning goals · Examples first</p>
        </motion.div>
      )}
      <LearnMobileTabBar state={{ ...state, learnNavActive: "Memory" }} />
    </WireframeScreen>
  );
}

export function LearnDashboardRichScene({ state }: { state: SceneState }) {
  const isMobile = useIsMobileLearn(state);

  return (
    <WireframeScreen label="Sudar Learn" variant="learn">
      <LearnNavChrome state={state} />
      <div className="flex flex-wrap items-center gap-2 mb-1">
        <p className="text-[13px] font-semibold text-zinc-900">Good afternoon, Marcus.</p>
        <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
          7 day streak
        </span>
      </div>
      <p className="text-[11px] text-zinc-500 mb-4">You have 3 courses in progress.</p>
      <PulseHighlight active={state.highlightId === "continue"} variant="learn">
        <p className="text-[10px] text-violet-600 font-medium uppercase mb-1">Continue</p>
        <p className="text-[12px] font-semibold text-zinc-900">Somehow I manage</p>
        <p className="text-[10px] text-zinc-500 mt-1">World&apos;s Best Boss 101 · Module 1</p>
        <div className="mt-2 h-1.5 rounded-full bg-zinc-100">
          <motion.div
            className="h-full rounded-full bg-violet-600"
            initial={{ width: 0 }}
            animate={{ width: "20%" }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />
        </div>
      </PulseHighlight>
      <div className="mt-4 rounded-xl bg-zinc-50 border border-zinc-100 px-3 py-2">
        <p className="text-[10px] text-zinc-600">
          Sudar has learned from 42 interactions, group dynamics, management…
        </p>
        <p className="text-[10px] text-violet-600 mt-1 font-medium">View memory →</p>
      </div>
      {isMobile && (
        <p className="text-[9px] text-zinc-400 text-center mt-2">Lagos · LTE</p>
      )}
      <LearnMobileTabBar state={state} />
    </WireframeScreen>
  );
}

export function StudioCohortScene({ state }: { state: SceneState }) {
  return (
    <WireframeScreen label="Sudar Studio · Paths & cohorts">
      <PulseHighlight active={state.highlightId === "cohort"}>
        <p className="text-[10px] font-mono text-zinc-600 uppercase mb-2">Learner cohort</p>
        <p className="text-[12px] text-white/85 font-medium">New hire store managers</p>
        <p className="text-[10px] text-zinc-600 mt-2">18 learners · Somehow I manage · Due Jun 30</p>
        <div className="mt-3 flex gap-2">
          <MiniChip active>MANDATORY</MiniChip>
          <MiniChip>ADAPTIVE WELCOME</MiniChip>
        </div>
      </PulseHighlight>
      <p className="mt-4 text-[10px] text-zinc-600">
        Same course, personalized path order and overlays per cohort policy.
      </p>
    </WireframeScreen>
  );
}
