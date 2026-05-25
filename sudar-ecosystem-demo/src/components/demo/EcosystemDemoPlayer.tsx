"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DEFAULT_STEP_MS,
  ecosystemChapters,
  flatSteps,
  getChapterStartIndex,
  mergeSceneState,
} from "@/data/ecosystemDemo";
import { WireframeScene } from "@/components/wireframes/WireframeScenes";
import { DemoCursor } from "./DemoCursor";
import { TransportBar, type PlaybackSpeed } from "./TransportBar";

type EcosystemDemoPlayerProps = {
  initialChapterId?: string;
  autoPlay?: boolean;
};

export function EcosystemDemoPlayer({
  initialChapterId,
  autoPlay = true,
}: EcosystemDemoPlayerProps) {
  const initialIndex = initialChapterId ? getChapterStartIndex(initialChapterId) : 0;
  const [globalIndex, setGlobalIndex] = useState(initialIndex);
  const [playing, setPlaying] = useState(autoPlay);
  const [speed, setSpeed] = useState<PlaybackSpeed>(1);

  const step = flatSteps[globalIndex];
  const totalSteps = flatSteps.length;
  const stepDuration = Math.round(DEFAULT_STEP_MS / speed);

  const sceneState = useMemo(() => (step ? mergeSceneState(step) : {}), [step]);

  const goTo = useCallback((index: number) => {
    setGlobalIndex(Math.max(0, Math.min(index, totalSteps - 1)));
  }, [totalSteps]);

  const next = useCallback(() => {
    goTo(globalIndex >= totalSteps - 1 ? 0 : globalIndex + 1);
  }, [globalIndex, goTo, totalSteps]);

  const prev = useCallback(() => {
    goTo(globalIndex <= 0 ? totalSteps - 1 : globalIndex - 1);
  }, [globalIndex, goTo, totalSteps]);

  const restart = useCallback(() => {
    setGlobalIndex(0);
    setPlaying(true);
  }, []);

  useEffect(() => {
    if (!playing || totalSteps <= 1) return;
    const id = window.setInterval(next, stepDuration);
    return () => window.clearInterval(id);
  }, [playing, next, stepDuration, totalSteps]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === "Space") {
        e.preventDefault();
        setPlaying((p) => !p);
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        next();
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        prev();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev]);

  if (!step) return null;

  const stepKey = `${step.chapterId}-${step.stepInChapter}-${globalIndex}`;

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      <div className="flex-1 rounded-2xl border border-card-border bg-card-bg overflow-hidden shadow-lg mx-4 sm:mx-6 mt-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[420px]">
          <div className="p-6 sm:p-8 border-b lg:border-b-0 lg:border-r border-card-border flex flex-col">
            <p className="text-[10px] font-mono tracking-[0.3em] text-primary/70 uppercase mb-1">
              {step.chapterTitle}
            </p>
            <p className="text-[10px] font-mono text-foreground-muted mb-6">
              Step {step.stepInChapter + 1} · {globalIndex + 1} of {totalSteps}
            </p>

            <AnimatePresence mode="wait">
              <motion.div
                key={stepKey}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="flex-1"
              >
                <h2 className="text-xl sm:text-2xl font-semibold text-foreground tracking-tight">
                  {step.title}
                </h2>
                <p className="mt-3 text-foreground-muted leading-relaxed">{step.body}</p>
                {step.callout ? (
                  <p className="mt-4 text-sm text-primary/80 border-l-2 border-primary/40 pl-3">
                    {step.callout}
                  </p>
                ) : null}
              </motion.div>
            </AnimatePresence>

            <div className="mt-8 flex gap-3 lg:hidden">
              <button
                type="button"
                onClick={prev}
                className="rounded-full border border-card-border px-4 py-2 text-sm text-foreground-muted"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={next}
                className="rounded-full bg-primary/90 text-white px-4 py-2 text-sm font-medium"
              >
                {globalIndex >= totalSteps - 1 ? "Restart" : "Next"}
              </button>
            </div>
          </div>

          <div className="relative p-4 sm:p-6 bg-[#080808]">
            <AnimatePresence mode="wait">
              <motion.div
                key={`scene-${stepKey}`}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="relative"
              >
                <WireframeScene id={step.scene} state={sceneState} />
                <DemoCursor
                  hotspot={step.hotspot}
                  action={step.action}
                  stepKey={stepKey}
                />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      <TransportBar
        playing={playing}
        globalIndex={globalIndex}
        totalSteps={totalSteps}
        chapters={ecosystemChapters}
        currentChapterId={step.chapterId}
        speed={speed}
        onPlayPause={() => setPlaying((p) => !p)}
        onScrub={goTo}
        onChapterJump={(id) => {
          goTo(getChapterStartIndex(id));
          setPlaying(false);
        }}
        onSpeedChange={setSpeed}
        onRestart={restart}
      />
    </div>
  );
}
