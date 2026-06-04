"use client";

import type { Ref } from "react";
import "@/styles/sudar-logo-animated.css";

const STAR_PATH =
  "M 50 2 C 51 49, 51 49, 98 50 C 51 51, 51 51, 50 98 C 49 51, 49 51, 2 50 C 49 49, 49 49, 50 2 Z";

export type SudarLogoSceneClass = "is-playing" | "is-holding";

type SudarLogoAnimatedMarkProps = {
  sceneClass: SudarLogoSceneClass;
  sceneRef?: Ref<HTMLDivElement>;
  canvasId?: string;
  restingGlow?: boolean;
  className?: string;
};

/** Animated Sudar mark (= → S + ★). Used in hero and scroll-flight clone. */
export function SudarLogoAnimatedMark({
  sceneClass,
  sceneRef,
  canvasId,
  restingGlow = true,
  className = "",
}: SudarLogoAnimatedMarkProps) {
  return (
    <div
      id={canvasId}
      className={`sudar-logo-canvas ${restingGlow && sceneClass === "is-holding" ? "is-resting" : ""} ${className}`}
    >
      <div ref={sceneRef} className={`sudar-logo-animated ${sceneClass}`}>
        <div className="pill pill--top" />
        <div className="star" aria-hidden>
          <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <path d={STAR_PATH} fill="#111" />
          </svg>
        </div>
        <div className="pill pill--bottom" />
      </div>
    </div>
  );
}
