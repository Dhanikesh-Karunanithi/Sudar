"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { HeroDemoCursor } from "@/components/home/HeroDemoCursor";
import { HeroLearnFlowScene } from "@/components/home/HeroLearnFlowScene";
import { HeroScene3D } from "@/components/home/HeroScene3D";
import { SwipeCardStrip } from "@/components/ui/SwipeCardStrip";
import { WireframeScene } from "@/components/wireframes/WireframeScenes";
import {
  HERO_STEP_MS,
  heroFlowSteps,
  mergeHeroSceneState,
  type HeroFlowStep,
} from "@/data/heroFlowDemo";
import { useIsMobile } from "@/hooks/useMediaQuery";

const easeOut = [0.22, 1, 0.36, 1] as const;

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

type HeroFlowStepCardProps = {
  step: HeroFlowStep;
  stepIndex: number;
  reducedMotion: boolean;
  enableMotion: boolean;
  mountScene: boolean;
  isActive?: boolean;
};

function HeroFlowStepCard({
  step,
  stepIndex,
  reducedMotion,
  enableMotion,
  mountScene,
  isActive = true,
}: HeroFlowStepCardProps) {
  const sceneRef = useRef<HTMLDivElement>(null);
  const isLearnFlow = Boolean(step.learnFlowPhase);
  const sceneState = useMemo(() => mergeHeroSceneState(step), [step]);
  const stepKey = isLearnFlow ? `learn-${step.learnFlowPhase}-${stepIndex}` : `hero-${stepIndex}`;

  return (
    <div className="flex flex-col">
      <div className="mb-3 min-h-[4rem] shrink-0">
        <h3 className="font-serif text-lg leading-snug tracking-tight text-white sm:text-xl">
          {step.title}
        </h3>
        <p className="mt-1.5 text-sm font-light leading-relaxed text-zinc-500">{step.body}</p>
      </div>

      <HeroScene3D reducedMotion={reducedMotion} disableTilt>
        <div
          ref={sceneRef}
          className="relative shrink-0 overflow-hidden rounded-2xl border border-white/[0.06] bg-[#050505]"
          style={{ height: HERO_SCENE_HEIGHT_PX }}
        >
          <div className="absolute inset-0 overflow-hidden">
            {mountScene ? (
              isLearnFlow && step.learnFlowPhase ? (
                <div className="absolute inset-0">
                  <HeroLearnFlowScene phase={step.learnFlowPhase} reducedMotion={reducedMotion} />
                </div>
              ) : (
                <div className="absolute inset-0 overflow-hidden p-2">
                  <div className="h-full w-full overflow-hidden [&_.rounded-2xl]:!rounded-lg [&_.rounded-2xl]:!h-full [&_.rounded-2xl]:!min-h-0 [&_.min-h-\\[280px\\]]:!min-h-0">
                    <WireframeScene
                      id={step.scene}
                      state={sceneState}
                      cinematic={enableMotion}
                      heroViewport
                    />
                  </div>
                </div>
              )
            ) : (
              <div className="absolute inset-0 bg-[#050505]" aria-hidden />
            )}
          </div>

          {enableMotion && mountScene && isActive ? (
            <HeroDemoCursor
              hotspot={step.hotspot}
              action={step.action}
              stepKey={`${stepKey}-${stepIndex}`}
              containerRef={sceneRef}
            />
          ) : null}
        </div>
      </HeroScene3D>
    </div>
  );
}

function DemoDots({
  index,
  onDotClick,
}: {
  index: number;
  onDotClick: (i: number) => void;
}) {
  return (
    <div className="flex items-center gap-1.5" role="tablist" aria-label="Demo steps">
      {heroFlowSteps.map((s, i) => (
        <button
          key={i}
          type="button"
          role="tab"
          aria-selected={i === index}
          aria-label={`Step ${i + 1}: ${s.title}`}
          onClick={() => onDotClick(i)}
          className={`h-1.5 rounded-full transition-all duration-300 ${
            i === index ? "w-8 bg-[#FF4500]/85" : "w-1.5 bg-white/15 hover:bg-white/30"
          }`}
        />
      ))}
    </div>
  );
}

export function HeroFlowDemo({ reducedMotion }: HeroFlowDemoProps) {
  const steps = heroFlowSteps;
  const totalSteps = steps.length;
  const staticIndex = totalSteps - 1;
  const isMobile = useIsMobile();

  const [index, setIndex] = useState(reducedMotion ? staticIndex : 0);
  const [playing, setPlaying] = useState(!reducedMotion && !isMobile);
  const [pausedUntil, setPausedUntil] = useState(0);
  const sceneRef = useRef<HTMLDivElement>(null);

  const step = steps[index];
  const isLearnFlow = Boolean(step?.learnFlowPhase);
  const sceneState = useMemo(() => (step ? mergeHeroSceneState(step) : {}), [step]);
  const stepKey = isLearnFlow ? `learn-${step?.learnFlowPhase}-${index}` : `hero-${index}`;
  const enableMotion = !reducedMotion;

  useEffect(() => {
    if (isMobile) setPlaying(false);
  }, [isMobile]);

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
    if (reducedMotion || !playing || totalSteps <= 1 || isMobile) return;
    if (Date.now() < pausedUntil) return;

    const id = window.setInterval(next, stepDurationMs(index));
    return () => window.clearInterval(id);
  }, [playing, next, totalSteps, reducedMotion, pausedUntil, index, isMobile]);

  const handleDotClick = (i: number) => {
    goTo(i);
    if (isMobile) return;
    setPlaying(false);
    const pauseMs = stepDurationMs(i) * 2;
    setPausedUntil(Date.now() + pauseMs);
    window.setTimeout(() => setPlaying(true), pauseMs);
  };

  const shouldMountScene = (i: number) => Math.abs(i - index) <= 1;

  if (!step) return null;

  return (
    <motion.div
      className="relative w-full"
      initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 32, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.9, delay: 0.85, ease: easeOut }}
    >
      <div
        className="hero-glass-ambient pointer-events-none absolute -inset-8 rounded-[2rem] blur-[72px] sm:-inset-10"
        aria-hidden
      />

      <div className="hero-float hero-glass-window relative overflow-hidden rounded-[1.75rem]">
        <div className="hero-glass-sheen pointer-events-none absolute inset-0 z-[1]" aria-hidden />

        <div className="relative z-[2] flex flex-col p-4 sm:p-6 lg:p-8">
          <p className="text-[10px] font-mono uppercase tracking-[0.35em] text-zinc-600 mb-3 shrink-0">
            See it in action
          </p>

          {isMobile ? (
            <SwipeCardStrip
              count={totalSteps}
              activeIndex={index}
              onIndexChange={goTo}
              ariaLabel="Hero demo steps"
              showHint
              slideClassName="!w-[min(92vw,360px)]"
            >
              {steps.map((s, i) => (
                <HeroFlowStepCard
                  key={i}
                  step={s}
                  stepIndex={i}
                  reducedMotion={reducedMotion}
                  enableMotion={enableMotion}
                  mountScene={shouldMountScene(i)}
                  isActive={i === index}
                />
              ))}
            </SwipeCardStrip>
          ) : (
            <>
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
                          key={stepKey}
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
            </>
          )}

          <div className="mt-5 flex shrink-0 items-center justify-between gap-4 border-t border-white/[0.1] pt-4">
            {!isMobile ? <DemoDots index={index} onDotClick={handleDotClick} /> : null}
            <Link
              href="/demo"
              className={`text-[11px] font-mono uppercase tracking-widest text-zinc-600 transition-colors hover:text-zinc-400 shrink-0 ${isMobile ? "ml-auto" : ""}`}
            >
              Full demo →
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
