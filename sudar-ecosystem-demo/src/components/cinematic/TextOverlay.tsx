"use client";

import { motion } from "framer-motion";
import { StaggerWords } from "./StaggerWords";

type TextOverlayProps = {
  eyebrow?: string;
  headline: string;
  body?: string;
};

/** Bottom-center captions, gradient depth only, no box container */
export function TextOverlay({ eyebrow, headline, body }: TextOverlayProps) {
  const wordCount = headline.split(/\s+/).filter(Boolean).length;
  const bodyDelay = 0.28 + wordCount * 0.055 + 0.18;

  return (
    <motion.div
      className="pointer-events-none absolute inset-x-0 bottom-0 z-40 flex flex-col items-center justify-end px-6 sm:px-10 pb-[5.5rem] sm:pb-28 text-center"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
    >
      <div
        className="absolute inset-x-0 bottom-0 h-[min(50vh,380px)] bg-gradient-to-t from-[#050505] via-[#050505]/90 to-transparent"
        aria-hidden
      />

      <div className="relative w-full max-w-3xl px-2">
        {eyebrow ? (
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="mb-3 text-[11px] sm:text-xs font-mono tracking-[0.35em] text-[#FF4500] uppercase drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]"
          >
            {eyebrow}
          </motion.p>
        ) : null}

        <h2 className="font-semibold tracking-tight text-white leading-[1.2] text-[clamp(1.35rem,4vw,2.5rem)] drop-shadow-[0_4px_24px_rgba(0,0,0,0.95)]">
          <StaggerWords text={headline} stagger={0.055} delay={0.14} className="justify-center" />
        </h2>

        {body ? (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: bodyDelay }}
            className="mt-3 sm:mt-4 text-zinc-300/95 leading-relaxed font-light text-base sm:text-lg drop-shadow-[0_2px_16px_rgba(0,0,0,0.9)]"
          >
            {body}
          </motion.p>
        ) : null}
      </div>
    </motion.div>
  );
}
