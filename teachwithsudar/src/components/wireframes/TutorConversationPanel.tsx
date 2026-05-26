"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { SudarLogoMark } from "@/components/brand/SudarLogoMark";
import type { SceneState } from "@/types/sceneState";
import { useWireframeCinematic } from "./WireframeCinematicContext";
import { MiniChip } from "./WireframePrimitives";

const DEFAULT_MESSAGE =
  "You paused on delegation in this scene. Want a Dunder-style example, or the formal definition?";

function useStreamedText(fullText: string, startAfterMs: number, active: boolean) {
  const [visible, setVisible] = useState(active ? "" : fullText);
  const [started, setStarted] = useState(!active);

  useEffect(() => {
    if (!active) {
      setVisible(fullText);
      setStarted(true);
      return;
    }
    setVisible("");
    setStarted(false);
    let intervalId: number | undefined;
    const delayId = window.setTimeout(() => {
      setStarted(true);
      const words = fullText.split(" ");
      let i = 0;
      intervalId = window.setInterval(() => {
        i += 1;
        setVisible(words.slice(0, i).join(" "));
        if (i >= words.length && intervalId) clearInterval(intervalId);
      }, 55);
    }, startAfterMs);
    return () => {
      clearTimeout(delayId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [fullText, startAfterMs, active]);

  return { visible, waiting: active && !started };
}

export function TutorConversationPanel({ state }: { state: SceneState }) {
  const cinematic = useWireframeCinematic();
  const mode = state.tutorMode ?? "proactive";
  const message = state.tutorMessage ?? DEFAULT_MESSAGE;
  const draft = state.learnerDraft ?? "";
  const reply = state.tutorReply ?? "";

  const proactiveStream = useStreamedText(
    message,
    1500,
    cinematic && mode === "proactive"
  );
  const replyStream = useStreamedText(
    reply || "Picture Michael handing Dwight a task list, that's delegation. Outcomes, not micromanaging.",
    400,
    cinematic && mode === "learner-reply" && !!reply
  );

  const showProactiveMessage = mode === "proactive" || mode === "typing";
  const displayMessage = cinematic && mode === "proactive" ? proactiveStream.visible : message;
  const showTypingDots = cinematic && mode === "proactive" && proactiveStream.waiting;

  return (
    <div
      className={`rounded-2xl border border-violet-200/80 bg-white/95 backdrop-blur-md p-4 shadow-xl shadow-violet-500/10 ${
        state.deviceLayout === "mobile" ? "w-full max-w-none ml-0" : "max-w-md ml-auto"
      }`}
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
          <SudarLogoMark size={22} variant="on-light" />
        </div>
        <div>
          <span className="text-[11px] font-semibold text-zinc-900">Sudar</span>
          <p className="text-[9px] text-violet-600 font-mono uppercase">Always online</p>
        </div>
      </div>

      {showProactiveMessage && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl bg-violet-50 border border-violet-100 px-3 py-2.5 mb-3 min-h-[3rem]"
        >
          {showTypingDots ? (
            <div className="flex gap-1 py-1">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-violet-400"
                  animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
                  transition={{ repeat: Infinity, duration: 0.9, delay: i * 0.15 }}
                />
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-zinc-800 leading-relaxed">
              {displayMessage}
              {cinematic && mode === "proactive" && displayMessage.length < message.length && (
                <span className="inline-block w-0.5 h-3 bg-violet-500 ml-0.5 align-middle animate-pulse" />
              )}
            </p>
          )}
        </motion.div>
      )}

      {mode === "proactive" && !showTypingDots && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex flex-wrap gap-2 mb-3"
        >
          <MiniChip active variant="learn">
            DUNDER EXAMPLE
          </MiniChip>
          <MiniChip variant="learn">FORMAL DEF</MiniChip>
        </motion.div>
      )}

      <div
        className={`rounded-xl border px-3 py-2 flex items-center gap-2 ${
          mode === "learner-reply"
            ? "border-violet-400 bg-violet-50/50"
            : "border-zinc-200 bg-zinc-50"
        }`}
      >
        <span className="flex-1 text-[11px] text-zinc-700 min-h-[1.25rem]">
          {draft || (mode === "learner-reply" ? "" : "Ask Sudar anything…")}
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

      {mode === "learner-reply" && (reply || cinematic) && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 rounded-lg bg-violet-50/80 border border-violet-100 px-3 py-2"
        >
          <p className="text-[10px] text-violet-800 leading-relaxed">
            {cinematic ? replyStream.visible : reply}
            {cinematic && replyStream.visible.length < (reply || "").length && reply && (
              <span className="inline-block w-0.5 h-2.5 bg-violet-600 ml-0.5 align-middle animate-pulse" />
            )}
          </p>
        </motion.div>
      )}
    </div>
  );
}
