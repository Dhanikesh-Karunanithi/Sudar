"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import type { DemoHotspot } from "@/data/ecosystemDemo";
import { ClickRipple } from "./ClickRipple";

type DemoCursorProps = {
  hotspot?: DemoHotspot;
  action?: "click" | "hover";
  stepKey: string;
};

const DEFAULT_POS = { x: 72, y: 8 };

export function DemoCursor({ hotspot, action = "click", stepKey }: DemoCursorProps) {
  const reducedMotion = useReducedMotion();
  const [clickFlash, setClickFlash] = useState(false);
  const target = hotspot ?? DEFAULT_POS;

  useEffect(() => {
    if (reducedMotion || action !== "click" || !hotspot) {
      setClickFlash(false);
      return;
    }
    setClickFlash(true);
    const t = window.setTimeout(() => setClickFlash(false), 500);
    return () => window.clearTimeout(t);
  }, [stepKey, action, hotspot, reducedMotion]);

  if (reducedMotion) {
    if (!hotspot) return null;
    return (
      <div
        className="absolute pointer-events-none z-30"
        style={{ left: `${target.x}%`, top: `${target.y}%`, transform: "translate(-50%, -50%)" }}
        aria-hidden
      >
        <span className="block w-6 h-6 rounded-full border-2 border-[#FF4500] ring-4 ring-[#FF4500]/20" />
      </div>
    );
  }

  return (
    <>
      <ClickRipple x={target.x} y={target.y} show={clickFlash} />
      <motion.div
        key={stepKey}
        className="absolute pointer-events-none z-30"
        initial={{ left: `${DEFAULT_POS.x}%`, top: `${DEFAULT_POS.y}%`, opacity: 0 }}
        animate={{
          left: `${target.x}%`,
          top: `${target.y}%`,
          opacity: 1,
          scale: action === "click" && clickFlash ? [1, 0.92, 1.08, 1] : 1,
        }}
        transition={{
          left: { duration: 0.75, ease: [0.22, 1, 0.36, 1] },
          top: { duration: 0.75, ease: [0.22, 1, 0.36, 1] },
          opacity: { duration: 0.2 },
          scale: { duration: 0.35 },
        }}
        style={{ transform: "translate(-4px, -2px)" }}
        aria-hidden
      >
        <svg width="24" height="28" viewBox="0 0 24 28" fill="none" className="drop-shadow-lg">
          <path
            d="M5 3L5 22L10 17L14 25L17 23L13 15L20 15L5 3Z"
            fill="white"
            stroke="rgba(0,0,0,0.35)"
            strokeWidth="1"
          />
        </svg>
      </motion.div>
    </>
  );
}
