"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  SudarLogoAnimatedMark,
  type SudarLogoSceneClass,
} from "@/components/gateway/SudarLogoAnimatedMark";
import "@/styles/sudar-logo-animated.css";

const LOGO_LOOP_INTERVAL_MS = 30_000;
const LOGO_ANIMATION_END_MS = 3_050;
const HOVER_REPLAY_COOLDOWN_MS = 8_000;

type LogoPhase = "playing" | "holding";

function resetScene(scene: HTMLDivElement) {
  scene.classList.remove("is-playing", "is-holding");
  const pills = scene.querySelectorAll<HTMLElement>(".pill");
  const star = scene.querySelector<HTMLElement>(".star");
  pills.forEach((el) => {
    el.style.animation = "none";
  });
  if (star) star.style.animation = "none";
  void scene.offsetHeight;
}

function playScene(scene: HTMLDivElement) {
  resetScene(scene);
  scene.classList.add("is-playing");
  const top = scene.querySelector<HTMLElement>(".pill--top");
  const bottom = scene.querySelector<HTMLElement>(".pill--bottom");
  const star = scene.querySelector<HTMLElement>(".star");
  if (top) top.style.animation = "";
  if (bottom) bottom.style.animation = "";
  if (star) star.style.animation = "";
}

function lockSudarMark(scene: HTMLDivElement) {
  scene.classList.remove("is-playing");
  scene.classList.add("is-holding");
}

type SudarLogoMotionProps = {
  className?: string;
  canvasId?: string;
  style?: React.CSSProperties;
};

export function SudarLogoMotion({
  className = "",
  canvasId,
  style,
}: SudarLogoMotionProps) {
  const sceneRef = useRef<HTMLDivElement>(null);
  const loopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastHoverReplayRef = useRef(0);
  const [phase, setPhase] = useState<LogoPhase>("playing");
  const [reducedMotion, setReducedMotion] = useState(false);

  const clearTimers = useCallback(() => {
    if (loopTimerRef.current) clearTimeout(loopTimerRef.current);
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    loopTimerRef.current = null;
    holdTimerRef.current = null;
  }, []);

  const runCycle = useCallback(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    clearTimers();
    setPhase("playing");
    playScene(scene);

    holdTimerRef.current = setTimeout(() => {
      lockSudarMark(scene);
      setPhase("holding");
    }, LOGO_ANIMATION_END_MS);

    loopTimerRef.current = setTimeout(() => {
      runCycle();
    }, LOGO_LOOP_INTERVAL_MS);
  }, [clearTimers]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => {
      const reduced = mq.matches;
      setReducedMotion(reduced);
      if (reduced && sceneRef.current) {
        clearTimers();
        resetScene(sceneRef.current);
        lockSudarMark(sceneRef.current);
        setPhase("holding");
      }
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [clearTimers]);

  useEffect(() => {
    if (reducedMotion) return;
    runCycle();
    return clearTimers;
  }, [reducedMotion, runCycle, clearTimers]);

  const handleHover = () => {
    if (reducedMotion) return;
    const now = Date.now();
    if (now - lastHoverReplayRef.current < HOVER_REPLAY_COOLDOWN_MS) return;
    lastHoverReplayRef.current = now;
    runCycle();
  };

  const sceneClass: SudarLogoSceneClass =
    phase === "playing" && !reducedMotion ? "is-playing" : "is-holding";

  return (
    <div
      className={`sudar-logo-stage ${className}`}
      style={style}
      onMouseEnter={handleHover}
      onFocus={handleHover}
      tabIndex={0}
      role="img"
      aria-label="Sudar logo"
    >
      <SudarLogoAnimatedMark
        canvasId={canvasId}
        sceneRef={sceneRef}
        sceneClass={sceneClass}
        restingGlow={phase === "holding"}
      />

      <p className="sudar-logo-whisper">
        Equal opportunity for <span className="sudar-logo-whisper__accent">all</span>.
      </p>
    </div>
  );
}
