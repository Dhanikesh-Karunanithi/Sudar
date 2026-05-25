"use client";

import { motion } from "framer-motion";
import type { SceneState } from "@/types/sceneState";

const SECTIONS = [
  {
    id: "security",
    title: "Security Responsibility",
    items: [
      { id: "intro", label: "Introduction to Security Responsibility" },
      { id: "practices", label: "Best Practices" },
      { id: "quiz1", label: "Quiz" },
    ],
  },
  {
    id: "risks",
    title: "Security Risks",
    items: [
      { id: "phishing", label: "Recognising Phishing" },
      { id: "quiz2", label: "Quiz" },
    ],
  },
  {
    id: "wrapup",
    title: "Wrap-up",
    items: [
      { id: "summary", label: "Course Summary" },
      { id: "cert", label: "Certification" },
    ],
  },
];

function StatusIcon({ done, locked }: { done?: boolean; locked?: boolean }) {
  if (done) {
    return (
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 text-[10px]">
        ✓
      </span>
    );
  }
  if (locked) {
    return <span className="h-5 w-5 rounded-full border border-white/10 bg-white/[0.03]" />;
  }
  return <span className="h-5 w-5 rounded-full border border-white/15 bg-white/[0.05]" />;
}

export function CourseOutlinePanel({ state }: { state: SceneState }) {
  const expanded = state.expandedSection ?? "security";
  const completed = new Set(state.completedModules ?? ["intro"]);

  return (
    <div className="rounded-xl border border-white/[0.08] bg-[#0d0d0d] p-4 sm:p-5">
      <p className="text-[11px] font-mono text-zinc-500 uppercase tracking-widest mb-4">Course Outline</p>
      <div className="space-y-2">
        {SECTIONS.map((section) => {
          const isOpen = expanded === section.id;
          return (
            <div
              key={section.id}
              className={`rounded-lg border overflow-hidden transition-colors ${
                isOpen ? "border-[#FF4500]/25 bg-white/[0.03]" : "border-white/[0.06]"
              }`}
            >
              <div className="flex items-center justify-between px-3 py-2.5">
                <span className="text-[12px] sm:text-[13px] text-white/85 font-medium">{section.title}</span>
                <motion.span
                  animate={{ rotate: isOpen ? 180 : 0 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className="text-zinc-600 text-[10px]"
                >
                  ▼
                </motion.span>
              </div>
              {isOpen ? (
                <motion.div
                  initial={state.uiMotion === "accordion-expand" ? { height: 0, opacity: 0 } : false}
                  animate={{ height: "auto", opacity: 1 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className="border-t border-white/[0.06] bg-white/[0.02] px-3 py-2 space-y-1.5"
                >
                  {section.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-2.5 rounded-md px-2 py-1.5"
                    >
                      <StatusIcon done={completed.has(item.id)} />
                      <span
                        className={`text-[11px] sm:text-[12px] flex-1 ${
                          completed.has(item.id) ? "text-zinc-400" : "text-zinc-500"
                        }`}
                      >
                        {item.label}
                      </span>
                      {completed.has(item.id) ? null : (
                        <span className="h-1.5 w-1.5 rounded-full bg-[#FF4500]/60 shrink-0" />
                      )}
                    </div>
                  ))}
                </motion.div>
              ) : null}
            </div>
          );
        })}
      </div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-[10px] text-zinc-600"
      >
        <span>Staff assignment</span>
        <span>Instructor · Auto</span>
      </motion.div>
    </div>
  );
}
