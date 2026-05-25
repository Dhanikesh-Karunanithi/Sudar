"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

type Scene3DStageProps = {
  children: ReactNode;
  frameKey: string;
};

/** 3D product-demo stage — single wireframe chrome, no duplicate outer frame */
export function Scene3DStage({ children, frameKey }: Scene3DStageProps) {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return (
      <div className="flex h-full w-full items-center justify-center px-4 sm:px-6">
        <div className="relative w-full max-w-[min(92vw,1040px)]">{children}</div>
      </div>
    );
  }

  return (
    <div
      className="flex h-full w-full items-center justify-center px-4 sm:px-6 overflow-visible"
      style={{ perspective: "1500px" }}
    >
      <motion.div
        key={frameKey}
        className="relative w-full max-w-[min(92vw,1040px)]"
        style={{ transformStyle: "preserve-3d" }}
        initial={{
          opacity: 0,
          scale: 0.9,
          rotateX: 12,
          rotateY: -5,
          y: 32,
          filter: "blur(4px)",
        }}
        animate={{
          opacity: 1,
          scale: 1,
          rotateX: [8, 5, 8],
          rotateY: [-2.5, 2.5, -2.5],
          y: [0, -8, 0],
          filter: "blur(0px)",
        }}
        transition={{
          opacity: { duration: 0.65, ease: [0.16, 1, 0.3, 1] },
          scale: { duration: 0.85, ease: [0.16, 1, 0.3, 1] },
          rotateX: { duration: 10, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" },
          rotateY: { duration: 12, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" },
          y: { duration: 8, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" },
          filter: { duration: 0.6 },
        }}
      >
        <motion.div
          className="absolute -inset-6 rounded-[1.75rem] bg-[#FF4500]/[0.07] blur-3xl pointer-events-none"
          animate={{ opacity: [0.3, 0.55, 0.3] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          aria-hidden
        />
        <div
          className="relative w-full shadow-[0_32px_80px_rgba(0,0,0,0.55)]"
          style={{ transform: "translateZ(32px)" }}
        >
          {children}
        </div>
      </motion.div>
    </div>
  );
}
