"use client";

import { motion } from "framer-motion";
import { SudarLogoMark } from "@/components/brand/SudarLogoMark";
import type { SceneState } from "@/types/sceneState";
import { MiniChip } from "./WireframePrimitives";

const DEFAULT_MESSAGE =
  "You paused on delegation in this scene — want a Dunder-style example, or the formal definition?";

export function TutorConversationPanel({ state }: { state: SceneState }) {
  const mode = state.tutorMode ?? "proactive";
  const message = state.tutorMessage ?? DEFAULT_MESSAGE;
  const draft = state.learnerDraft ?? "";

  return (
    <div className="max-w-md ml-auto rounded-2xl border border-violet-200/80 bg-white/95 backdrop-blur-md p-4 shadow-xl shadow-violet-500/10">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
          <SudarLogoMark size={22} variant="on-light" />
        </div>
        <div>
          <span className="text-[11px] font-semibold text-zinc-900">Sudar</span>
          <p className="text-[9px] text-violet-600 font-mono uppercase">Always online</p>
        </div>
      </div>

      {mode !== "idle" && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl bg-violet-50 border border-violet-100 px-3 py-2.5 mb-3"
        >
          <p className="text-[11px] text-zinc-800 leading-relaxed">{message}</p>
          {mode === "typing" && (
            <span className="inline-block mt-1 text-violet-500 animate-pulse">▋</span>
          )}
        </motion.div>
      )}

      {mode === "proactive" && (
        <div className="flex flex-wrap gap-2 mb-3">
          <MiniChip active variant="learn">
            DUNDER EXAMPLE
          </MiniChip>
          <MiniChip variant="learn">FORMAL DEF</MiniChip>
        </div>
      )}

      <div
        className={`rounded-xl border px-3 py-2 flex items-center gap-2 ${
          mode === "learner-reply"
            ? "border-violet-400 bg-violet-50/50"
            : "border-zinc-200 bg-zinc-50"
        }`}
      >
        <span className="flex-1 text-[11px] text-zinc-700 min-h-[1.25rem]">
          {draft ||
            (mode === "learner-reply" ? "" : "Ask Sudar anything…")}
          {mode === "learner-reply" && draft && (
            <motion.span
              className="inline-block w-0.5 h-3 bg-violet-600 ml-0.5 align-middle"
              animate={{ opacity: [1, 0, 1] }}
              transition={{ repeat: Infinity, duration: 0.8 }}
            />
          )}
        </span>
        <span className="w-7 h-7 rounded-full bg-violet-600 text-white text-[10px] flex items-center justify-center">
          →
        </span>
      </div>

      {mode === "learner-reply" && draft.length > 8 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-2 text-[10px] text-violet-700"
        >
          Got it — here&apos;s a quick Dunder-style take on delegation…
        </motion.p>
      )}
    </div>
  );
}
