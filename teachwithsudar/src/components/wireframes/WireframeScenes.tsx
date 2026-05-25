"use client";

import { motion } from "framer-motion";
import { SudarLogoMark } from "@/components/brand/SudarLogoMark";
import { MiniChip, PlaceholderLine, PulseHighlight, WireframeScreen } from "./WireframePrimitives";

export type WireframeSceneId =
  | "studio-dashboard"
  | "studio-new-course"
  | "studio-editor"
  | "studio-integrations"
  | "studio-settings"
  | "learn-dashboard"
  | "learn-course-viewer"
  | "learn-tutor"
  | "learn-memory"
  | "learn-settings"
  | "alp-flow";

const sceneLabels: Record<WireframeSceneId, string> = {
  "studio-dashboard": "Sudar Studio",
  "studio-new-course": "Sudar Studio · New course",
  "studio-editor": "Sudar Studio · Editor",
  "studio-integrations": "Sudar Studio · Integrations",
  "studio-settings": "Sudar Studio · Settings",
  "learn-dashboard": "Sudar Learn",
  "learn-course-viewer": "Sudar Learn · Course",
  "learn-tutor": "Sudar Learn · Tutor",
  "learn-memory": "Sudar Learn · Memory",
  "learn-settings": "Sudar Learn · Settings",
  "alp-flow": "ALP · Events",
};

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

function StudioDashboardScene() {
  return (
    <WireframeScreen label={sceneLabels["studio-dashboard"]} pulse>
      <div className="grid grid-cols-1 lg:grid-cols-[160px_1fr] gap-4">
        <StudioSidebar active="Courses" />
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <PulseHighlight>
              <span className="text-[11px] text-white/80 font-medium">+ New course</span>
            </PulseHighlight>
            <MiniChip>FROM DOCUMENT</MiniChip>
            <MiniChip>FROM URL</MiniChip>
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
        </div>
      </div>
    </WireframeScreen>
  );
}

function StudioNewCourseScene() {
  return (
    <WireframeScreen label={sceneLabels["studio-new-course"]}>
      <div className="grid lg:grid-cols-2 gap-4">
        <PulseHighlight>
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
          <motion.div
            className="mt-3 h-2 rounded-full bg-white/[0.06] overflow-hidden"
            initial={false}
          >
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

function StudioEditorScene() {
  return (
    <WireframeScreen label={sceneLabels["studio-editor"]}>
      <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-4">
        <div className="space-y-2">
          {["01 Intro", "02 Core", "03 Quiz"].map((s, i) => (
            <div
              key={s}
              className={`rounded-lg px-3 py-2 text-[11px] border ${
                i === 1 ? "border-[#FF4500]/30 bg-[#FF4500]/[0.06] text-zinc-400" : "border-white/[0.05] text-zinc-600"
              }`}
            >
              {s}
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-[#0d0d0d] p-4">
          <div className="flex gap-2 mb-4">
            <MiniChip>TEXT</MiniChip>
            <MiniChip>IMAGE</MiniChip>
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

function StudioIntegrationsScene() {
  return (
    <WireframeScreen label={sceneLabels["studio-integrations"]} pulse>
      <div className="grid lg:grid-cols-2 gap-4">
        <PulseHighlight>
          <p className="text-[11px] text-white/80 font-medium mb-2">ALP API key</p>
          <div className="font-mono text-[10px] text-zinc-500 break-all">sk_alp_••••••••••••</div>
          <div className="mt-3 flex gap-2">
            <MiniChip>COPY</MiniChip>
            <MiniChip>ROTATE</MiniChip>
          </div>
        </PulseHighlight>
        <PulseHighlight>
          <p className="text-[11px] text-white/80 font-medium mb-2">MCP / ChatGPT</p>
          <PlaceholderLine w="w-full" />
          <div className="mt-2">
            <PlaceholderLine w="w-[80%]" />
          </div>
          <div className="mt-3">
            <MiniChip>MCP.JSON</MiniChip>
          </div>
        </PulseHighlight>
      </div>
    </WireframeScreen>
  );
}

function StudioSettingsScene() {
  return (
    <WireframeScreen label={sceneLabels["studio-settings"]}>
      <div className="space-y-3 max-w-md">
        {["Localization", "AI personalization", "Tutor memory cadence", "Compliance"].map((row, i) => (
          <div
            key={row}
            className={`flex items-center justify-between rounded-lg border px-4 py-3 ${
              i === 1 ? "border-[#FF4500]/25 bg-[#FF4500]/[0.04]" : "border-white/[0.06]"
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

function LearnDashboardScene() {
  return (
    <WireframeScreen label={sceneLabels["learn-dashboard"]}>
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="rounded-xl border border-white/[0.06] bg-[#0d0d0d] p-4">
          <p className="text-[10px] font-mono text-zinc-600 uppercase mb-2">Continue</p>
          <PlaceholderLine w="w-[75%]" />
          <div className="mt-3 h-2 rounded-full bg-white/[0.06]">
            <div className="h-full w-[45%] rounded-full bg-[#FF4500]/50" />
          </div>
        </div>
        <div className="rounded-xl border border-[#FF4500]/15 bg-[#FF4500]/[0.04] p-4">
          <p className="text-[10px] font-mono text-[#FF4500]/60 uppercase mb-2">Sudar suggests</p>
          <PlaceholderLine w="w-[88%]" />
          <div className="mt-3 flex flex-wrap gap-2">
            <MiniChip>CONTINUE</MiniChip>
            <MiniChip>REVIEW</MiniChip>
          </div>
        </div>
      </div>
    </WireframeScreen>
  );
}

function LearnCourseViewerScene() {
  return (
    <WireframeScreen label={sceneLabels["learn-course-viewer"]}>
      <div className="flex flex-wrap gap-2 mb-4">
        {["Read", "Listen", "Watch", "Map", "Cards"].map((tab, i) => (
          <span
            key={tab}
            className={`text-[10px] font-mono px-3 py-1 rounded-full border ${
              i === 0 ? "border-[#FF4500]/40 bg-[#FF4500]/10 text-[#FF4500]/80" : "border-white/[0.06] text-zinc-600"
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
            <PlaceholderLine w="w-[88%]" />
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

function LearnTutorScene() {
  return (
    <WireframeScreen label={sceneLabels["learn-tutor"]} pulse>
      <div className="max-w-sm ml-auto rounded-2xl border border-white/[0.08] bg-[#0d0d0d] p-4 shadow-lg">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#FF4500]/20">
            <SudarLogoMark size={22} variant="on-dark" />
          </div>
          <span className="text-[11px] text-white/80">Sudar</span>
        </div>
        <div className="space-y-2 mb-3">
          <div className="rounded-lg bg-white/[0.04] p-2">
            <PlaceholderLine w="w-[90%]" />
          </div>
          <PulseHighlight>
            <PlaceholderLine w="w-[70%]" />
          </PulseHighlight>
        </div>
        <div className="flex flex-wrap gap-2">
          <MiniChip>EXPLAIN</MiniChip>
          <MiniChip>QUIZ ME</MiniChip>
        </div>
      </div>
    </WireframeScreen>
  );
}

function LearnMemoryScene() {
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
        <PulseHighlight>
          <p className="text-[10px] font-mono text-[#FF4500]/60 uppercase mb-3">Tutor memory</p>
          <div className="text-[11px] text-zinc-500 space-y-1">
            <p>LLM cadence · Weekly</p>
            <p>Digest spacing · 7 days</p>
          </div>
        </PulseHighlight>
      </div>
    </WireframeScreen>
  );
}

function LearnSettingsScene() {
  return (
    <WireframeScreen label={sceneLabels["learn-settings"]}>
      <div className="max-w-md space-y-3">
        <div className="rounded-xl border border-[#FF4500]/20 bg-[#FF4500]/[0.04] p-4">
          <p className="text-[11px] text-white/80 mb-2">Notification sounds</p>
          <div className="h-2 rounded-full bg-white/[0.08]">
            <div className="h-full w-2/3 rounded-full bg-[#FF4500]/60" />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <MiniChip>TASK</MiniChip>
            <MiniChip>REPLY</MiniChip>
            <MiniChip>TOAST</MiniChip>
          </div>
        </div>
      </div>
    </WireframeScreen>
  );
}

function AlpFlowScene() {
  return (
    <WireframeScreen label={sceneLabels["alp-flow"]}>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 py-2">
        <div className="rounded-xl border border-white/[0.06] px-4 py-3 text-[11px] text-zinc-500">
          Moodle LMS
        </div>
        <motion.span
          className="text-[#FF4500]/60 font-mono text-xs"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        >
          POST /api/alp/events →
        </motion.span>
        <div className="rounded-xl border border-[#FF4500]/25 bg-[#FF4500]/[0.06] px-4 py-3 text-[11px] text-zinc-400">
          Sudar Learn + Twin
        </div>
      </div>
    </WireframeScreen>
  );
}

const sceneComponents: Record<WireframeSceneId, () => React.JSX.Element> = {
  "studio-dashboard": StudioDashboardScene,
  "studio-new-course": StudioNewCourseScene,
  "studio-editor": StudioEditorScene,
  "studio-integrations": StudioIntegrationsScene,
  "studio-settings": StudioSettingsScene,
  "learn-dashboard": LearnDashboardScene,
  "learn-course-viewer": LearnCourseViewerScene,
  "learn-tutor": LearnTutorScene,
  "learn-memory": LearnMemoryScene,
  "learn-settings": LearnSettingsScene,
  "alp-flow": AlpFlowScene,
};

export function WireframeScene({ id }: { id: WireframeSceneId }) {
  const Component = sceneComponents[id];
  return <Component />;
}
