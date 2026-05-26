"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { SudarLogoMark } from "@/components/brand/SudarLogoMark";

export type HeroTutorPhase = "hidden" | "proactive" | "typing" | "reply";

const PROACTIVE_MSG =
  "You paused on delegation in this scene. Want a Dunder-style example, or the formal definition?";

const LEARNER_DRAFT = "Dunder example please. Keep it short";

const SUDAR_REPLY =
  "Picture Michael handing Dwight a task list — that's delegation. Outcomes, not micromanaging.";

function useTypewriter(text: string, active: boolean, speedMs = 28) {
  const [out, setOut] = useState(active ? "" : text);

  useEffect(() => {
    if (!active) {
      setOut(text);
      return;
    }
    setOut("");
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setOut(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, speedMs);
    return () => clearInterval(id);
  }, [text, active, speedMs]);

  return out;
}

type HeroTutorChatProps = {
  phase: HeroTutorPhase;
  reducedMotion: boolean;
};

export function HeroTutorChat({ phase, reducedMotion }: HeroTutorChatProps) {
  const showPanel = phase !== "hidden";
  const [replySubPhase, setReplySubPhase] = useState<"typing" | "reply">("typing");

  useEffect(() => {
    if (phase !== "reply") {
      setReplySubPhase("typing");
      return;
    }
    if (reducedMotion) {
      setReplySubPhase("reply");
      return;
    }
    setReplySubPhase("typing");
    const t = window.setTimeout(() => setReplySubPhase("reply"), 1600);
    return () => clearTimeout(t);
  }, [phase, reducedMotion]);

  const typingActive = phase === "typing" || (phase === "reply" && replySubPhase === "typing");
  const replyActive = phase === "reply" && replySubPhase === "reply";

  const proactiveText = useTypewriter(
    PROACTIVE_MSG,
    !reducedMotion && phase === "proactive",
    22
  );
  const draftText = useTypewriter(LEARNER_DRAFT, !reducedMotion && typingActive, 32);
  const replyText = useTypewriter(SUDAR_REPLY, !reducedMotion && replyActive, 24);

  const displayProactive = reducedMotion || phase !== "proactive" ? PROACTIVE_MSG : proactiveText;
  const displayDraft =
    typingActive || replyActive
      ? reducedMotion
        ? LEARNER_DRAFT
        : draftText
      : "";
  const displayReply = replyActive ? (reducedMotion ? SUDAR_REPLY : replyText) : "";

  return (
    <AnimatePresence>
      {showPanel ? (
        <motion.aside
          key="tutor-panel"
          initial={{ opacity: 0, x: 48, scale: 0.96 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 32, scale: 0.98 }}
          transition={{ type: "spring", stiffness: 260, damping: 28 }}
          className="absolute right-0 top-0 bottom-0 z-20 flex w-[min(100%,300px)] flex-col border-l border-violet-200/60 bg-white/98 shadow-[-24px_0_48px_rgba(124,58,237,0.12)] backdrop-blur-md sm:w-[300px]"
        >
          <div className="flex items-center gap-2.5 border-b border-violet-100 px-4 py-3 shrink-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100">
              <SudarLogoMark size={24} variant="on-light" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-semibold text-zinc-900">Sudar</p>
              <p className="flex items-center gap-1.5 text-[9px] text-violet-600">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Context from your lesson
              </p>
            </div>
          </div>

          <div className="flex-1 overflow-hidden px-3 py-3 space-y-3 min-h-0">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.4 }}
              className="flex gap-2"
            >
              <div className="mt-1 h-6 w-6 shrink-0 rounded-full bg-violet-100 flex items-center justify-center">
                <SudarLogoMark size={16} variant="on-light" />
              </div>
              <div className="rounded-2xl rounded-tl-md bg-violet-50 border border-violet-100 px-3 py-2.5 max-w-[92%]">
                <p className="text-[11px] leading-relaxed text-zinc-800">
                  {displayProactive}
                  {!reducedMotion && phase === "proactive" && displayProactive.length < PROACTIVE_MSG.length && (
                    <span className="inline-block w-0.5 h-3 bg-violet-500 ml-0.5 align-middle animate-pulse" />
                  )}
                </p>
              </div>
            </motion.div>

            {(phase === "proactive" || phase === "typing" || phase === "reply") && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="flex flex-wrap gap-1.5 pl-8"
              >
                {["Dunder example", "Formal def"].map((chip, i) => (
                  <span
                    key={chip}
                    className={`text-[9px] font-medium px-2.5 py-1 rounded-full border ${
                      i === 0 && (phase === "typing" || phase === "reply")
                        ? "border-violet-400 bg-violet-100 text-violet-800"
                        : "border-zinc-200 bg-zinc-50 text-zinc-500"
                    }`}
                  >
                    {chip}
                  </span>
                ))}
              </motion.div>
            )}

            <AnimatePresence>
              {(typingActive || replyActive) && displayDraft.length > 0 && (
                <motion.div
                  key="learner-bubble"
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className="flex justify-end"
                >
                  <div className="rounded-2xl rounded-tr-md bg-violet-600 px-3 py-2 max-w-[85%] shadow-md shadow-violet-600/20">
                    <p className="text-[11px] text-white leading-relaxed">
                      {displayDraft}
                      {typingActive && displayDraft.length < LEARNER_DRAFT.length && (
                        <span className="inline-block w-0.5 h-3 bg-white/80 ml-0.5 align-middle animate-pulse" />
                      )}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {replyActive && displayReply.length > 0 && (
                <motion.div
                  key="sudar-reply"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-2"
                >
                  <div className="mt-1 h-6 w-6 shrink-0 rounded-full bg-violet-100 flex items-center justify-center">
                    <SudarLogoMark size={16} variant="on-light" />
                  </div>
                  <div className="rounded-2xl rounded-tl-md bg-violet-50 border border-violet-100 px-3 py-2 max-w-[92%]">
                    <p className="text-[11px] leading-relaxed text-violet-900">
                      {displayReply}
                      {!reducedMotion && displayReply.length < SUDAR_REPLY.length && (
                        <span className="inline-block w-0.5 h-3 bg-violet-500 ml-0.5 align-middle animate-pulse" />
                      )}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div
            className={`shrink-0 border-t px-3 py-3 ${
              typingActive ? "border-violet-300 bg-violet-50/80" : "border-zinc-100 bg-zinc-50/90"
            }`}
          >
            <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2">
              <span className="flex-1 text-[11px] text-zinc-600 truncate min-h-[1.25rem]">
                {typingActive || replyActive ? displayDraft || "…" : "Ask Sudar anything…"}
              </span>
              <motion.span
                className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-600 text-white text-xs"
                animate={
                  typingActive
                    ? { scale: [1, 1.08, 1], boxShadow: ["0 0 0 rgba(124,58,237,0)", "0 0 16px rgba(124,58,237,0.45)", "0 0 0 rgba(124,58,237,0)"] }
                    : {}
                }
                transition={{ repeat: typingActive ? Infinity : 0, duration: 1.2 }}
              >
                →
              </motion.span>
            </div>
          </div>
        </motion.aside>
      ) : null}
    </AnimatePresence>
  );
}
