"use client";

import { motion, useReducedMotion } from "framer-motion";

export function CinematicBackdrop() {
  const reducedMotion = useReducedMotion();

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      <div className="absolute inset-0 bg-[#050505]" />
      <motion.div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[min(120vw,900px)] h-[min(80vh,600px)] rounded-full bg-[#FF4500]/[0.06] blur-[100px]"
        animate={reducedMotion ? undefined : { opacity: [0.35, 0.55, 0.35], scale: [1, 1.08, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-[#050505] to-transparent"
        initial={false}
      />
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
        aria-hidden
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#050505_72%)]" />
    </div>
  );
}
