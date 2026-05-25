"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import type { GenerationSource, ModalityTab, SceneState } from "@/types/sceneState";
import { BloomBlueprintStrip } from "./BloomBlueprintStrip";
import { CourseBlockCanvas } from "./CourseBlockCanvas";
import { LearnNavChrome } from "./LearnNavChrome";
import { MiniChip, PlaceholderLine, PulseHighlight, WireframeScreen } from "./WireframePrimitives";
import { TutorConversationPanel } from "./TutorConversationPanel";

const SOURCES: { id: GenerationSource; label: string }[] = [
  { id: "document", label: "Document" },
  { id: "idea", label: "Idea / prompt" },
  { id: "business", label: "Business need" },
  { id: "cohort", label: "Cohort" },
  { id: "learner", label: "Learner context" },
];

const SARAH_PROMPT =
  "Create fun ways to manage an office — taught by Michael Scott from The Office. Engaging, relatable, but learners still master real management basics.";

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
          <p className="text-[11px] text-zinc-400 leading-relaxed">{SARAH_PROMPT}</p>
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
        {OFFICE_MODULES.slice(0, 3).map((m) => (
          <div key={m} className="rounded-lg border border-white/[0.06] px-2 py-2 text-[10px] text-zinc-600">
            {m}
          </div>
        ))}
      </div>
    </WireframeScreen>
  );
}

export function StudioIdBlueprintScene({ state }: { state: SceneState }) {
  return (
    <WireframeScreen label="Sudar Studio · Instructional blueprint">
      <div className="grid lg:grid-cols-[1fr_220px] gap-4">
        <div className="rounded-xl border border-white/[0.06] bg-[#0d0d0d] p-4">
          <p className="text-[10px] text-zinc-600 uppercase mb-2">Generated outline · 5 modules</p>
          {OFFICE_MODULES.map((m, i) => (
            <div
              key={m}
              className={`mb-2 rounded-lg px-3 py-2 text-[11px] border ${
                i === 0
                  ? "border-[#FF4500]/25 bg-[#FF4500]/[0.04] text-zinc-400"
                  : "border-white/[0.05] text-zinc-600"
              }`}
            >
              {m}
            </div>
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

  return (
    <WireframeScreen label="Sudar Studio · Editor">
      <div className="grid grid-cols-1 lg:grid-cols-[180px_1fr] gap-4">
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

export function LearnCourseRichScene({ state }: { state: SceneState }) {
  const activeTab = state.activeTab ?? "Watch";
  const progress = state.videoProgress ?? 0;
  const accordionOpen = state.accordionExpanded ?? false;
  const flipped = state.flipcardFlipped ?? false;

  return (
    <WireframeScreen label="Sudar Learn · Somehow I manage" variant="learn">
      <LearnNavChrome state={{ ...state, learnNavActive: "Courses" }} />
      <p className="text-[12px] font-semibold text-zinc-900 mb-3">
        World&apos;s Best Boss 101: Introduction to Management
      </p>
      <div className="flex flex-wrap gap-2 mb-3">
        {MODALITY_TABS.map((tab) => (
          <span
            key={tab}
            className={`text-[10px] font-medium px-3 py-1 rounded-full border ${
              tab === activeTab
                ? "border-violet-500 bg-violet-600 text-white"
                : "border-zinc-200 text-zinc-500 bg-white"
            }`}
          >
            {tab}
          </span>
        ))}
      </div>
      <div className="space-y-3">
        {activeTab === "Watch" && (
          <PulseHighlight active={progress > 0} variant="learn">
            <div className="relative aspect-video rounded-xl overflow-hidden bg-zinc-900 border border-zinc-200">
              <Image
                src="/characters/prison-mike.png"
                alt="Lesson video"
                fill
                className="object-cover object-top"
                sizes="500px"
              />
              {progress > 0 && progress < 100 && (
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <span className="text-[10px] text-white/90 bg-black/50 px-2 py-1 rounded">
                    Paused · {progress}%
                  </span>
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-700">
                <div
                  className="h-full bg-violet-500 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </PulseHighlight>
        )}
        {activeTab !== "Watch" && (
          <div className="rounded-xl border border-zinc-200 p-3 text-[11px] text-zinc-600">
            {activeTab} modality — same module content
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
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-2 text-[10px] text-zinc-600"
            >
              Great managers delegate outcomes — not just tasks. Michael… tries.
            </motion.p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {["Empathy", "Accountability"].map((label, i) => (
            <div
              key={label}
              className={`h-16 rounded-xl border flex items-center justify-center text-[10px] transition-transform ${
                flipped && i === 0
                  ? "border-violet-400 bg-violet-100 text-violet-800 rotate-y-180"
                  : "border-zinc-200 bg-white text-zinc-500"
              }`}
            >
              {flipped && i === 0 ? "Listen first, then decide" : label}
            </div>
          ))}
        </div>
      </div>
    </WireframeScreen>
  );
}

export function LearnTutorContextualScene({ state }: { state: SceneState }) {
  return (
    <WireframeScreen label="Sudar Learn · Tutor" variant="learn">
      <LearnNavChrome state={state} />
      <div className="grid lg:grid-cols-[1fr_280px] gap-4 items-end min-h-[200px]">
        <div className="relative aspect-video rounded-xl overflow-hidden border border-zinc-200 opacity-60">
          <Image
            src="/characters/prison-mike.png"
            alt="Lesson context"
            fill
            className="object-cover object-top"
            sizes="300px"
          />
          <p className="absolute bottom-2 left-2 text-[9px] text-white bg-black/50 px-2 py-0.5 rounded">
            On screen: delegation scene
          </p>
        </div>
        <TutorConversationPanel state={state} />
      </div>
    </WireframeScreen>
  );
}

export function LearnMemoryRichScene({ state }: { state: SceneState }) {
  const hi = state.memoryHighlight ?? "twin";

  return (
    <WireframeScreen label="Sudar Learn · Memory" variant="learn">
      <LearnNavChrome state={{ ...state, learnNavActive: "Memory" }} />
      <div className="rounded-2xl bg-gradient-to-r from-violet-600 to-violet-700 px-4 py-5 mb-4 text-white">
        <p className="text-[14px] font-bold">Sudar&apos;s Memory</p>
        <p className="text-[11px] text-violet-100 mt-1 opacity-90">
          Built from 60 interactions — your style and context personalize every conversation.
        </p>
      </div>
      <div className="grid sm:grid-cols-3 gap-2 mb-4">
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
        <div className="mt-4 rounded-xl border border-violet-200 bg-violet-50/50 p-3">
          <p className="text-[10px] font-semibold text-zinc-800 mb-2">Your context</p>
          <p className="text-[10px] text-zinc-600">Background · Learning goals · Examples first</p>
        </div>
      )}
    </WireframeScreen>
  );
}

export function LearnDashboardRichScene({ state }: { state: SceneState }) {
  return (
    <WireframeScreen label="Sudar Learn" variant="learn">
      <LearnNavChrome state={state} />
      <p className="text-[13px] font-semibold text-zinc-900 mb-1">Good afternoon, Marcus.</p>
      <p className="text-[11px] text-zinc-500 mb-4">You have 3 courses in progress.</p>
      <PulseHighlight active={state.highlightId === "continue"} variant="learn">
        <p className="text-[10px] text-violet-600 font-medium uppercase mb-1">Continue</p>
        <p className="text-[12px] font-semibold text-zinc-900">Somehow I manage</p>
        <p className="text-[10px] text-zinc-500 mt-1">World&apos;s Best Boss 101 · Module 1</p>
        <div className="mt-2 h-1.5 rounded-full bg-zinc-100">
          <div className="h-full w-[20%] rounded-full bg-violet-600" />
        </div>
      </PulseHighlight>
      <div className="mt-4 rounded-xl bg-zinc-50 border border-zinc-100 px-3 py-2">
        <p className="text-[10px] text-zinc-600">
          Sudar has learned from 42 interactions — group dynamics, management…
        </p>
        <p className="text-[10px] text-violet-600 mt-1 font-medium">View memory →</p>
      </div>
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
        Same course — personalized path order and overlays per cohort policy.
      </p>
    </WireframeScreen>
  );
}
