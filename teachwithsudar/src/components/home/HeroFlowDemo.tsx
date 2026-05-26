"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { HeroDemoCursor } from "@/components/home/HeroDemoCursor";
import { HeroLearnFlowScene } from "@/components/home/HeroLearnFlowScene";
import { HeroScene3D } from "@/components/home/HeroScene3D";
import { WireframeScene } from "@/components/wireframes/WireframeScenes";
import {
  HERO_STEP_MS,
  heroFlowSteps,
  mergeHeroSceneState,
} from "@/data/heroFlowDemo";

const easeOut = [0.22, 1, 0.36, 1] as const;
const LEARN_FLOW_KEY = "hero-learn-flow";

/** Fixed viewport — inner content adapts; outer shell never resizes */
export const HERO_SCENE_HEIGHT_PX = 400;

type HeroFlowDemoProps = {
  reducedMotion: boolean;
};

function stepDurationMs(index: number): number {
  const step = heroFlowSteps[index];
  if (step?.learnFlowPhase === "tutor-reply") return 5200;
  if (step?.learnFlowPhase === "tutor-proactive") return 4800;
  if (step?.scene === "studio-create-sources") return 5200;
  return HERO_STEP_MS;
}

export function HeroFlowDemo({ reducedMotion }: HeroFlowDemoProps) {
  const steps = heroFlowSteps;
  const totalSteps = steps.length;
  const staticIndex = totalSteps - 1;

  const [index, setIndex] = useState(reducedMotion ? staticIndex : 0);
  const [playing, setPlaying] = useState(!reducedMotion);
  const [pausedUntil, setPausedUntil] = useState(0);
  const sceneRef = useRef<HTMLDivElement>(null);

  const step = steps[index];
  const isLearnFlow = Boolean(step?.learnFlowPhase);
  const sceneState = useMemo(() => (step ? mergeHeroSceneState(step) : {}), [step]);
  const stepKey = isLearnFlow ? LEARN_FLOW_KEY : `hero-${index}`;
  const enableMotion = !reducedMotion;

  const goTo = useCallback(
    (nextIndex: number) => {
      setIndex(Math.max(0, Math.min(nextIndex, totalSteps - 1)));
    },
    [totalSteps]
  );

  const next = useCallback(() => {
    goTo(index >= totalSteps - 1 ? 0 : index + 1);
  }, [goTo, index, totalSteps]);

  useEffect(() => {
    if (reducedMotion || !playing || totalSteps <= 1) return;
    if (Date.now() < pausedUntil) return;

    const id = window.setInterval(next, stepDurationMs(index));
    return () => window.clearInterval(id);
  }, [playing, next, totalSteps, reducedMotion, pausedUntil, index]);

  const handleDotClick = (i: number) => {
    goTo(i);
    setPlaying(false);
    const pauseMs = stepDurationMs(i) * 2;
    setPausedUntil(Date.now() + pauseMs);
    window.setTimeout(() => setPlaying(true), pauseMs);
  };

  if (!step) return null;

  return (
    <motion.div
      className="relative w-full"
      initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 32, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.9, delay: 0.85, ease: easeOut }}
    >
      <div
        className="pointer-events-none absolute -inset-8 rounded-[2rem] blur-[80px] sm:-inset-12"
        style={{
          background:
            "radial-gradient(ellipse at 50% 40%, rgba(255,69,0,0.14) 0%, rgba(255,69,0,0.03) 55%, transparent 75%)",
        }}
        aria-hidden
      />

      <div className="hero-float relative overflow-hidden rounded-[1.75rem] border border-white/[0.08] bg-[#0a0a0a]/85 shadow-[0_40px_120px_rgba(0,0,0,0.6)] backdrop-blur-md">
        <div
          className="pointer-events-none absolute inset-0 opacity-90"
          aria-hidden
          style={{
            background:
              "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(255,69,0,0.1) 0%, transparent 60%)",
          }}
        />

        <div className="relative flex flex-col p-4 sm:p-6 lg:p-8">
          <p className="text-[10px] font-mono uppercase tracking-[0.35em] text-zinc-600 mb-3 shrink-0">
            See it in action
          </p>

          {/* Caption first — visible without scrolling past the demo */}
          <div className="mb-4 min-h-[4.5rem] shrink-0 max-w-3xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={`caption-${index}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.35, ease: easeOut }}
              >
                <h3 className="font-serif text-xl leading-snug tracking-tight text-white sm:text-2xl">
                  {step.title}
                </h3>
                <p className="mt-1.5 text-sm font-light leading-relaxed text-zinc-500 sm:text-base">
                  {step.body}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Fixed-height stage */}
          <HeroScene3D reducedMotion={reducedMotion}>
            <div
              ref={sceneRef}
              className="relative shrink-0 overflow-hidden rounded-2xl border border-white/[0.06] bg-[#050505]"
              style={{ height: HERO_SCENE_HEIGHT_PX }}
            >
              <div className="absolute inset-0 overflow-hidden">
                <AnimatePresence mode="wait">
                  {isLearnFlow && step.learnFlowPhase ? (
                    <motion.div
                      key={LEARN_FLOW_KEY}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.4, ease: easeOut }}
                      className="absolute inset-0"
                    >
                      <HeroLearnFlowScene
                        phase={step.learnFlowPhase}
                        reducedMotion={reducedMotion}
                      />
                    </motion.div>
                  ) : (
                    <motion.div
                      key={stepKey}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.4, ease: easeOut }}
                      className="absolute inset-0 overflow-hidden p-2 sm:p-2.5"
                    >
                      <div className="h-full w-full overflow-hidden [&_.rounded-2xl]:!rounded-lg [&_.rounded-2xl]:!h-full [&_.rounded-2xl]:!min-h-0 [&_.min-h-\\[280px\\]]:!min-h-0">
                        <WireframeScene
                          id={step.scene}
                          state={sceneState}
                          cinematic={enableMotion}
                          heroViewport
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {enableMotion ? (
                <HeroDemoCursor
                  hotspot={step.hotspot}
                  action={step.action}
                  stepKey={`${stepKey}-${index}`}
                  containerRef={sceneRef}
                />
              ) : null}
            </div>
          </HeroScene3D>

          <div className="mt-5 flex shrink-0 items-center justify-between gap-4 border-t border-white/[0.06] pt-4">
            <div className="flex items-center gap-1.5" role="tablist" aria-label="Demo steps">
              {steps.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  role="tab"
                  aria-selected={i === index}
                  aria-label={`Step ${i + 1}: ${s.title}`}
                  onClick={() => handleDotClick(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === index
                      ? "w-8 bg-[#FF4500]/85"
                      : "w-1.5 bg-white/15 hover:bg-white/30"
                  }`}
                />
              ))}
            </div>
            <Link
              href="/demo"
              className="text-[11px] font-mono uppercase tracking-widest text-zinc-600 transition-colors hover:text-zinc-400 shrink-0"
            >
              Full demo →
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
