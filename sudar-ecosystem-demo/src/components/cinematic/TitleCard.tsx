"use client";

import { motion, useReducedMotion } from "framer-motion";
import { SudarLogoMark } from "@/components/brand/SudarLogoMark";
import { StaggerWords } from "./StaggerWords";

type TitleCardProps = {
  eyebrow?: string;
  headline: string;
  subhead?: string;
  showLogo?: boolean;
  logoOnly?: boolean;
};

export function TitleCard({ eyebrow, headline, subhead, showLogo, logoOnly }: TitleCardProps) {
  const reducedMotion = useReducedMotion();
  const wordCount = headline.split(/\s+/).filter(Boolean).length;
  const subheadDelay = 0.35 + wordCount * 0.08 + 0.25;

  if (logoOnly && showLogo) {
    return (
      <div
        className="absolute inset-0 flex flex-col items-center justify-center bg-[#050505] px-8"
        style={{ perspective: "1200px" }}
      >
        <CinematicBackdropMinimal />
        <motion.div
          initial={
            reducedMotion
              ? { opacity: 1 }
              : { opacity: 0, scale: 0.6, rotateY: -28, rotateX: 12 }
          }
          animate={
            reducedMotion
              ? { opacity: 1 }
              : { opacity: 1, scale: 1, rotateY: 0, rotateX: 0 }
          }
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
          style={{ transformStyle: "preserve-3d" }}
          className="flex flex-col items-center"
        >
          <motion.div
            animate={reducedMotion ? undefined : { rotateY: [0, 6, 0, -6, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          >
            <SudarLogoMark size={112} variant="on-dark" className="drop-shadow-2xl" />
          </motion.div>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.55 }}
            className="mt-10 text-[clamp(1.25rem,3vw,1.75rem)] font-light tracking-wide text-zinc-400"
          >
            {headline}
          </motion.p>
        </motion.div>
      </div>
    );
  }

  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center bg-[#050505] px-6 sm:px-16"
      style={{ perspective: "1200px" }}
    >
      <CinematicBackdropMinimal />
      {showLogo ? (
        <motion.div
          initial={reducedMotion ? { opacity: 1 } : { opacity: 0, scale: 0.85, rotateY: -12 }}
          animate={{ opacity: 1, scale: 1, rotateY: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mb-10 sm:mb-12"
          style={{ transformStyle: "preserve-3d" }}
        >
          <SudarLogoMark size={88} variant="on-dark" />
        </motion.div>
      ) : null}

      {eyebrow ? (
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="mb-8 text-[11px] sm:text-xs font-mono tracking-[0.4em] text-[#FF4500]/90 uppercase"
        >
          {eyebrow}
        </motion.p>
      ) : null}

      <h1 className="text-center text-[clamp(2rem,6.5vw,4.25rem)] font-semibold leading-[1.1] tracking-tight text-white max-w-5xl">
        <StaggerWords text={headline} stagger={0.07} delay={eyebrow ? 0.2 : 0.15} />
      </h1>

      {subhead ? (
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: subheadDelay }}
          className="mt-8 text-center text-xl sm:text-2xl text-zinc-500 font-light max-w-3xl leading-relaxed"
        >
          {subhead}
        </motion.p>
      ) : null}
    </div>
  );
}

function CinematicBackdropMinimal() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-[#FF4500]/[0.08] blur-[90px]" />
    </div>
  );
}
