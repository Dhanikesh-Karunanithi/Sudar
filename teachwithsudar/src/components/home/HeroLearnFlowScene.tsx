"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { LearnNavChrome } from "@/components/wireframes/LearnNavChrome";
import { HeroTutorChat, type HeroTutorPhase } from "./HeroTutorChat";

type HeroLearnFlowSceneProps = {
  phase: "course" | "tutor-proactive" | "tutor-reply";
  reducedMotion: boolean;
};

export function HeroLearnFlowScene({ phase, reducedMotion }: HeroLearnFlowSceneProps) {
  const tutorPhase: HeroTutorPhase =
    phase === "course"
      ? "hidden"
      : phase === "tutor-proactive"
        ? "proactive"
        : phase === "tutor-reply"
          ? "reply"
          : "hidden";

  const tutorOpen = phase !== "course";

  return (
    <div className="absolute inset-0 flex flex-col overflow-hidden rounded-xl border border-zinc-200/80 bg-white">
      <div className="flex shrink-0 items-center justify-between border-b border-zinc-100 bg-zinc-50/90 px-3 py-2">
        <div className="flex gap-1.5">
          <span className="h-2 w-2 rounded-full bg-zinc-300" />
          <span className="h-2 w-2 rounded-full bg-zinc-300" />
          <span className="h-2 w-2 rounded-full bg-zinc-300" />
        </div>
        <span className="text-[9px] font-mono tracking-widest text-zinc-400 uppercase">
          Sudar Learn · Somehow I manage
        </span>
      </div>

      <div className="relative flex min-h-0 flex-1 flex-col p-3 sm:p-4">
        <div className="shrink-0">
          <LearnNavChrome state={{ learnNavActive: "Courses" }} />
          <p className="mb-2 text-[12px] font-semibold text-zinc-900 truncate">
            World&apos;s Best Boss 101: Introduction to Management
          </p>
          <div className="mb-2 flex flex-wrap gap-1">
            {(["Read", "Listen", "Watch", "Map", "Cards"] as const).map((tab) => (
              <span
                key={tab}
                className={`shrink-0 rounded-full border px-2 py-0.5 text-[8px] font-medium ${
                  tab === "Watch"
                    ? "border-violet-500 bg-violet-600 text-white"
                    : "border-zinc-200 text-zinc-500 bg-white"
                }`}
              >
                {tab}
              </span>
            ))}
          </div>
        </div>

        <div
          className={`relative min-h-0 flex-1 transition-[padding] duration-500 ease-out ${
            tutorOpen ? "pr-[min(42%,300px)]" : ""
          }`}
        >
          <div className="relative h-full min-h-[140px] max-h-full overflow-hidden rounded-lg border border-zinc-200 bg-zinc-900">
            <Image
              src="/characters/prison-mike.png"
              alt="Lesson video"
              fill
              className="object-cover object-[center_38%] scale-[1.1]"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-violet-900/20" />
            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
              <span className="rounded-md bg-black/55 px-2 py-0.5 text-[9px] text-white/95">
                Paused · 62%
              </span>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-700">
              <div className="h-full w-[62%] bg-violet-500" />
            </div>
            <motion.p
              initial={false}
              animate={{ opacity: tutorOpen ? 1 : 0 }}
              className="absolute bottom-2 left-2 z-10 rounded bg-black/50 px-1.5 py-0.5 text-[8px] text-white/90"
            >
              On screen: delegation scene
            </motion.p>
          </div>

          <div
            className={`mt-2 shrink-0 transition-opacity duration-500 ${
              tutorOpen ? "opacity-100" : "opacity-0 h-0 overflow-hidden"
            }`}
          >
            <p className="rounded-md border border-violet-200 bg-violet-50/60 px-2 py-1 text-[9px] text-violet-800">
              Sudar noticed you paused — opening tutor with lesson context…
            </p>
          </div>
        </div>

        <HeroTutorChat
          phase={phase === "tutor-reply" ? "reply" : tutorPhase}
          reducedMotion={reducedMotion}
        />
      </div>
    </div>
  );
}
