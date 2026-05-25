"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import type { UiMotion } from "@/types/sceneState";

type SceneStageProps = {
  children: ReactNode;
  frameKey: string;
  uiMotion?: UiMotion;
};

/**
 * Triboo-style stage: static camera, sharp UI, controlled vertical/slide motion only.
 */
export function SceneStage({ children, frameKey, uiMotion = "static" }: SceneStageProps) {
  const reducedMotion = useReducedMotion();

  const enterY = uiMotion === "scroll-down" ? 28 : uiMotion === "slide-in" ? 20 : 10;

  if (reducedMotion) {
    return (
      <div className="flex h-full w-full items-center justify-center px-4 sm:px-8">
        <div className="relative w-full max-w-[min(90vw,1080px)]">{children}</div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full items-center justify-center px-4 sm:px-8 overflow-visible">
      <motion.div
        key={frameKey}
        className="relative w-full max-w-[min(90vw,1080px)]"
        initial={{ opacity: 0, y: enterY }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{
          duration: 0.55,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        <div
          className="relative rounded-2xl sm:rounded-3xl border border-white/[0.08] bg-[#0a0a0a] shadow-[0_24px_60px_rgba(0,0,0,0.45)] overflow-visible"
        >
          {children}
        </div>
      </motion.div>
    </div>
  );
}
