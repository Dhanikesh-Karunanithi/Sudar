"use client";

import { motion } from "framer-motion";

export interface Step {
  number: string;
  title: string;
  description: string;
}

export function JourneySteps({ steps }: { steps: Step[] }) {
  return (
    <div className="relative">
      {steps.map((step, i) => (
        <motion.div
          key={step.number}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: i * 0.08 }}
          className="relative flex gap-6 pl-0 sm:pl-2"
        >
          <div className="flex flex-col items-center shrink-0">
            <div className="w-11 h-11 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center z-10">
              <span className="text-sm font-bold text-primary">{step.number}</span>
            </div>
            {i < steps.length - 1 && (
              <div className="absolute top-12 left-[22px] bottom-[-1.5rem] w-px bg-border" aria-hidden />
            )}
          </div>
          <div className="flex-1 min-w-0 pb-12 sm:pb-14">
            <div className="rounded-2xl border border-card-border bg-card-bg p-5 sm:p-6 shadow-card hover:shadow-card-hover transition-shadow">
              <h3 className="text-lg font-semibold text-foreground mb-2 tracking-tight sm:text-xl">
                {step.title}
              </h3>
              <p className="text-foreground leading-relaxed text-[15px] sm:text-base">
                {step.description}
              </p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
