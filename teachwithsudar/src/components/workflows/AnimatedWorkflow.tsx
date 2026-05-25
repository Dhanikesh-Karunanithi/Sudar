"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import type { TutorialStep } from "@/data/tutorials";
import { WireframeScene } from "@/components/wireframes/WireframeScenes";

type AnimatedWorkflowProps = {
  steps: TutorialStep[];
  autoPlay?: boolean;
};

export function AnimatedWorkflow({ steps, autoPlay = true }: AnimatedWorkflowProps) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(autoPlay);

  const step = steps[index];
  const isLast = index >= steps.length - 1;

  const next = useCallback(() => {
    setIndex((i) => (i >= steps.length - 1 ? 0 : i + 1));
  }, [steps.length]);

  const prev = useCallback(() => {
    setIndex((i) => (i <= 0 ? steps.length - 1 : i - 1));
  }, [steps.length]);

  useEffect(() => {
    if (!playing || steps.length <= 1) return;
    const id = window.setInterval(next, 6000);
    return () => window.clearInterval(id);
  }, [playing, next, steps.length]);

  if (!step) return null;

  return (
    <div className="rounded-2xl border border-card-border bg-card-bg overflow-hidden shadow-card">
      <div className="grid grid-cols-1 lg:grid-cols-2">
        <div className="p-6 sm:p-8 border-b lg:border-b-0 lg:border-r border-card-border flex flex-col min-h-[280px]">
          <div className="flex items-center justify-between gap-4 mb-6">
            <p className="text-[10px] font-mono tracking-[0.3em] text-primary/70 uppercase">
              Step {index + 1} of {steps.length}
            </p>
            <button
              type="button"
              onClick={() => setPlaying((p) => !p)}
              className="text-[11px] font-mono text-foreground-muted hover:text-foreground border border-card-border rounded-full px-3 py-1 transition-colors"
            >
              {playing ? "Pause" : "Play"}
            </button>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="flex-1"
            >
              <h3 className="text-xl font-semibold text-foreground tracking-tight">{step.title}</h3>
              <p className="mt-3 text-foreground-muted leading-relaxed">{step.body}</p>
              {step.callout ? (
                <p className="mt-4 text-sm text-primary/80 border-l-2 border-primary/40 pl-3">{step.callout}</p>
              ) : null}
            </motion.div>
          </AnimatePresence>

          <div className="mt-8 flex items-center gap-3">
            <button
              type="button"
              onClick={prev}
              className="rounded-full border border-card-border px-4 py-2 text-sm text-foreground-muted hover:text-foreground hover:border-primary/30 transition-colors"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={next}
              className="rounded-full bg-primary/90 hover:bg-primary text-white px-4 py-2 text-sm font-medium transition-colors"
            >
              {isLast ? "Restart" : "Next"}
            </button>
          </div>

          <div className="mt-6 flex gap-1.5">
            {steps.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Go to step ${i + 1}`}
                onClick={() => setIndex(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === index ? "w-8 bg-primary" : "w-2 bg-white/10 hover:bg-white/20"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="p-4 sm:p-6 bg-[#080808]">
          <AnimatePresence mode="wait">
            <motion.div
              key={`scene-${index}`}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <WireframeScene id={step.scene} />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
