"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import type { CameraEffect } from "@/data/launchDemo";

type Scene3DStageProps = {
  children: ReactNode;
  frameKey: string;
  cameraEffect?: CameraEffect;
  mobile?: boolean;
};

const KEN_BURNS_DURATION = 8;

function cameraMotion(effect: CameraEffect = "static") {
  switch (effect) {
    case "zoom-in":
      return { scale: [1, 1.06] as [number, number], x: 0 };
    case "zoom-out":
      return { scale: [1.06, 1] as [number, number], x: 0 };
    case "push-left":
      return { scale: 1, x: [0, -28] as [number, number] };
    case "push-right":
      return { scale: 1, x: [0, 28] as [number, number] };
    default:
      return { scale: 1, x: 0 };
  }
}

/** 3D product-demo stage, Ken Burns / pan + subtle 3D tilt */
export function Scene3DStage({
  children,
  frameKey,
  cameraEffect = "static",
  mobile = false,
}: Scene3DStageProps) {
  const reducedMotion = useReducedMotion();
  const cam = cameraMotion(cameraEffect);
  const hasKenBurns = cameraEffect === "zoom-in" || cameraEffect === "zoom-out";
  const hasPan = cameraEffect === "push-left" || cameraEffect === "push-right";
  const maxWidth = mobile ? "min(42vw,390px)" : "min(96vw,1180px)";

  if (reducedMotion) {
    return (
      <div className="flex h-full w-full items-center justify-center px-4 sm:px-6">
        <div className={`relative ${mobile ? "w-auto" : "w-full"}`} style={{ maxWidth }}>
          {children}
        </div>
      </div>
    );
  }

  const tiltX = mobile ? 6 : 12;
  const tiltY = mobile ? 1.5 : 2.5;

  return (
    <div
      className="flex h-full w-full items-center justify-center px-4 sm:px-6 overflow-visible"
      style={{ perspective: "1500px" }}
    >
      <motion.div
        key={frameKey}
        className={`relative ${mobile ? "w-auto shrink-0" : "w-full"}`}
        style={{ maxWidth, transformStyle: "preserve-3d" }}
        initial={{
          opacity: 0,
          scale: cameraEffect === "zoom-out" ? 1.06 : 0.92,
          rotateX: tiltX,
          rotateY: mobile ? 0 : -5,
          y: mobile ? 16 : 32,
          x: cameraEffect === "push-right" ? 20 : cameraEffect === "push-left" ? -20 : 0,
          filter: "blur(4px)",
        }}
        animate={{
          opacity: 1,
          scale: hasKenBurns ? cam.scale : 1,
          x: hasPan ? cam.x : 0,
          rotateX: [tiltX, tiltX - 2, tiltX],
          rotateY: mobile ? 0 : [-tiltY, tiltY, -tiltY],
          y: mobile ? 0 : [0, -8, 0],
          filter: "blur(0px)",
        }}
        transition={{
          opacity: { duration: 0.65, ease: [0.16, 1, 0.3, 1] },
          scale: hasKenBurns
            ? { duration: KEN_BURNS_DURATION, ease: "linear" }
            : { duration: 0.85, ease: [0.16, 1, 0.3, 1] },
          x: hasPan
            ? { duration: KEN_BURNS_DURATION, ease: "linear" }
            : { duration: 0.85, ease: [0.16, 1, 0.3, 1] },
          rotateX: { duration: 10, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" },
          rotateY: { duration: 12, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" },
          y: { duration: 8, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" },
          filter: { duration: 0.6 },
        }}
      >
        <motion.div
          className={`absolute bg-[#FF4500]/[0.07] blur-3xl pointer-events-none ${
            mobile ? "-inset-4 rounded-[3.5rem]" : "-inset-6 rounded-[1.75rem]"
          }`}
          animate={{ opacity: [0.3, 0.55, 0.3] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          aria-hidden
        />
        <div
          className={`relative ${mobile ? "w-auto" : "w-full"} ${
            mobile ? "" : "shadow-[0_32px_80px_rgba(0,0,0,0.55)]"
          }`}
          style={{ transform: "translateZ(32px)" }}
        >
          {children}
        </div>
      </motion.div>
    </div>
  );
}
