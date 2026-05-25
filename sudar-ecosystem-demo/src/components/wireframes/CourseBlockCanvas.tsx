"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import type { CourseBlockType, SceneState } from "@/types/sceneState";
import { MiniChip, PulseHighlight } from "./WireframePrimitives";

const BLOCK_META: Record<
  CourseBlockType,
  { label: string; icon: string; preview?: "video" | "flipcard" }
> = {
  text: { label: "Text", icon: "¶" },
  video: { label: "Video overview", icon: "▶", preview: "video" },
  audio: { label: "Podcast segment", icon: "♪" },
  accordion: { label: "Expandable · Key terms", icon: "≡" },
  flipcard: { label: "Flip cards · Quiz prep", icon: "↻", preview: "flipcard" },
  quiz: { label: "Knowledge check", icon: "?" },
};

const DEFAULT_ORDER: CourseBlockType[] = [
  "text",
  "video",
  "audio",
  "accordion",
  "flipcard",
  "quiz",
];

export function CourseBlockCanvas({
  state,
  highlightAddBlock,
}: {
  state: SceneState;
  highlightAddBlock?: boolean;
}) {
  const visible = state.visibleBlocks ?? [];
  const order = DEFAULT_ORDER.filter((b) => visible.includes(b));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-mono text-zinc-600 uppercase">Module blocks</p>
        <PulseHighlight active={highlightAddBlock}>
          <span className="text-[10px] text-[#FF4500]/80 font-medium">+ Add block</span>
        </PulseHighlight>
      </div>
      <AnimatePresence initial={false}>
        {order.map((block, i) => (
          <motion.div
            key={block}
            initial={state.uiMotion === "slide-in" ? { opacity: 0, y: 12 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: i * 0.05 }}
            className="rounded-xl border border-white/[0.08] bg-[#111] overflow-hidden"
          >
            <div className="flex items-center gap-2 px-3 py-2 border-b border-white/[0.06]">
              <span className="text-[10px] text-zinc-500 w-4">{BLOCK_META[block].icon}</span>
              <span className="text-[11px] text-zinc-400 flex-1">{BLOCK_META[block].label}</span>
              <MiniChip>READY</MiniChip>
            </div>
            {block === "text" && (
              <p className="px-3 py-2 text-[10px] text-zinc-500 leading-relaxed">
                Welcome to World&apos;s Best Boss 101 — Michael Scott teaches management, Dunder
                Mifflin style.
              </p>
            )}
            {block === "video" && (
              <div className="relative aspect-video bg-black/40 mx-2 mb-2 rounded-lg overflow-hidden">
                <Image
                  src="/characters/prison-mike.png"
                  alt="Course video preview"
                  fill
                  className="object-cover object-top opacity-90"
                  sizes="400px"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-white text-sm">
                    ▶
                  </span>
                </div>
                <p className="absolute bottom-1 left-2 text-[8px] text-white/60">7 scenes · TTS ready</p>
              </div>
            )}
            {block === "audio" && (
              <div className="px-3 py-3 flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full bg-white/[0.08]">
                  <div className="h-full w-1/3 rounded-full bg-[#FF4500]/50" />
                </div>
                <span className="text-[9px] text-zinc-600">26 segments</span>
              </div>
            )}
            {block === "accordion" && (
              <div className="px-3 py-2">
                <div className="rounded-lg border border-white/[0.06] px-2 py-1.5 text-[10px] text-zinc-500">
                  ▼ Delegation vs. micromanagement
                </div>
              </div>
            )}
            {block === "flipcard" && (
              <div className="px-3 py-2 grid grid-cols-2 gap-2">
                {["Empathy", "Accountability"].map((t) => (
                  <div
                    key={t}
                    className="h-14 rounded-lg border border-violet-500/20 bg-violet-500/5 flex items-center justify-center text-[9px] text-zinc-500"
                  >
                    {t}
                  </div>
                ))}
              </div>
            )}
            {block === "quiz" && (
              <p className="px-3 py-2 text-[10px] text-zinc-500 italic">
                What&apos;s the most important quality for a manager — according to Michael?
              </p>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
      {order.length === 0 && (
        <div className="h-24 rounded-xl border border-dashed border-white/[0.1] flex items-center justify-center text-[11px] text-zinc-600">
          Blocks appear as Sarah adds them…
        </div>
      )}
    </div>
  );
}
