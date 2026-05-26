"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { HeroFlowDemo } from "@/components/home/HeroFlowDemo";
import { HeroScrollLogo } from "@/components/home/HeroScrollLogo";
import { STUDIO_APP_URL } from "@/lib/site-nav";

const easeOut = [0.22, 1, 0.36, 1] as const;

function textRevealVariant(reducedMotion: boolean, delay: number) {
  return reducedMotion
    ? {
        hidden: { opacity: 0 },
        show: {
          opacity: 1,
          transition: { duration: 0.5, delay },
        },
      }
    : {
        hidden: { opacity: 0, y: 32, filter: "blur(10px)" },
        show: {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          transition: { duration: 0.9, delay, ease: easeOut },
        },
      };
}

export function HeroSection() {
  const reducedMotion = useReducedMotion() ?? false;

  return (
    <section
      className="relative flex flex-col items-center justify-start overflow-hidden bg-[#050505] pb-12 pt-2 sm:pb-16 sm:pt-3"
      aria-label="Hero: Sudar"
    >
      <HeroScrollLogo />

      <div className="pointer-events-none absolute inset-0 select-none" aria-hidden>
        <div
          className="hero-glow absolute left-1/2 top-[-20%] h-[620px] w-[min(1000px,130vw)] -translate-x-1/2 rounded-full blur-[150px]"
          style={{
            background:
              "radial-gradient(ellipse, rgba(255,69,0,0.18) 0%, rgba(255,120,50,0.05) 48%, transparent 72%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)",
            backgroundSize: "36px 36px",
          }}
        />
      </div>

      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-b from-transparent to-[#050505]"
        aria-hidden
      />

      <div className="relative z-10 mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center text-center">
          {!reducedMotion ? (
            <div
              className="relative h-[4.5rem] w-full sm:h-[4.75rem]"
              aria-hidden
            >
              <div
                id="hero-logo-anchor"
                className="pointer-events-none absolute left-1/2 top-1/2 h-px w-px -translate-x-1/2 -translate-y-1/2"
              />
            </div>
          ) : null}

          <motion.p
            className={`text-[11px] font-mono uppercase tracking-[0.34em] text-zinc-600 ${
              reducedMotion ? "" : "mt-3 sm:mt-4"
            }`}
            initial="hidden"
            animate="show"
            variants={textRevealVariant(reducedMotion, 0.05)}
          >
            The learning platform that remembers
          </motion.p>

          <h1 className="mt-6 text-balance font-serif text-[clamp(2.75rem,7vw,4.75rem)] font-medium leading-[1.04] tracking-tight text-white">
            <motion.span
              className="block"
              initial="hidden"
              animate="show"
              variants={textRevealVariant(reducedMotion, 0.18)}
            >
              Learns with you,
            </motion.span>
            <motion.span
              className="hero-text-line-accent mt-1 block italic font-light"
              initial="hidden"
              animate="show"
              variants={textRevealVariant(reducedMotion, 0.32)}
            >
              for you.
            </motion.span>
          </h1>

          <motion.p
            className="mt-7 max-w-2xl text-balance text-lg font-light leading-[1.65] text-zinc-400 sm:text-xl sm:leading-[1.6]"
            initial="hidden"
            animate="show"
            variants={textRevealVariant(reducedMotion, 0.48)}
          >
            When training adapts to the learner, retention rises and support burden falls.
            Sudar makes that practical, an open platform where authoring, delivery, and
            intelligence work as one system.
          </motion.p>

          <motion.p
            className="mt-5 max-w-xl text-balance text-base font-light leading-relaxed text-zinc-500"
            initial="hidden"
            animate="show"
            variants={textRevealVariant(reducedMotion, 0.62)}
          >
            Start from a document, URL, or brief in Studio. Sudar carries context forward
            session to session, what someone struggled with, what they&apos;ve mastered,
            when they need a nudge, and shapes what comes next.
          </motion.p>

          <motion.div
            className="mt-10 flex flex-col items-center gap-5 sm:flex-row sm:justify-center"
            initial="hidden"
            animate="show"
            variants={textRevealVariant(reducedMotion, 0.76)}
          >
            <Link
              href="/demo"
              className="group inline-flex items-center gap-2.5 rounded-full bg-[#FF4500] px-8 py-3.5 text-sm font-medium tracking-wide text-white shadow-[0_0_44px_rgba(255,69,0,0.26)] transition-all duration-300 hover:bg-[#FF5722] hover:shadow-[0_0_60px_rgba(255,69,0,0.38)]"
            >
              See Sudar in action
              <svg
                className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>

            <Link
              href="/story"
              className="text-sm tracking-wide text-zinc-500 transition-colors duration-200 hover:text-zinc-300"
            >
              Why we built Sudar →
            </Link>
          </motion.div>

          <motion.p
            className="mt-8 text-sm text-zinc-600"
            initial="hidden"
            animate="show"
            variants={textRevealVariant(reducedMotion, 0.88)}
          >
            Open source · Self-host free ·{" "}
            <a
              href={STUDIO_APP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-500 underline-offset-4 transition-colors hover:text-zinc-300 hover:underline"
            >
              Try Studio
            </a>
          </motion.p>
        </div>

      </div>

      <div className="relative z-10 mt-10 w-full px-4 sm:mt-12 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-[1400px]">
          <HeroFlowDemo reducedMotion={reducedMotion} />
        </div>
      </div>

      <div
        className="pointer-events-none absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center"
        aria-hidden
      >
        <div className="hero-scroll-cue h-10 w-px bg-gradient-to-b from-transparent via-white/12 to-transparent" />
      </div>
    </section>
  );
}
