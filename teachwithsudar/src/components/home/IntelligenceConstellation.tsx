"use client";

import { GatewayHeadline } from "@/components/gateway/GatewayHeadline";
import { GatewaySection } from "@/components/gateway/GatewaySection";
import { LearnerTwinVisualization } from "@/components/home/LearnerTwinVisualization";

const signals = [
  {
    title: "Modality preferences",
    desc: "Dynamically shifts scores for text, video, audio, mindmaps, and flashcards based on engagement depth.",
    icon: (
      <svg className="w-5 h-5 text-brand-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    title: "Behavioral telemetry",
    desc: "Analyzes passive signals like pause rates, video replays, reading speed, and scrolling patterns.",
    icon: (
      <svg className="w-5 h-5 text-[var(--brand-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    title: "Dynamic skill graph",
    desc: "Maps conceptual mastery and knowledge gaps in real-time, feeding the Next Best Action engine.",
    icon: (
      <svg className="w-5 h-5 text-brand-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
  },
];

export function IntelligenceConstellation() {
  return (
    <GatewaySection id="learner-twin">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
        <div className="lg:col-span-5 flex flex-col gap-8">
          <GatewayHeadline badge="Digital Learner Twin" accent="you." accentStyle="word" accentOnNewLine>
            Sudar learns
          </GatewayHeadline>

          <p className="text-lg text-[var(--text-secondary)] font-light leading-relaxed">
            Every interaction—replays, pauses, quiz scores, and cognitive pace—silently feeds a secure, private
            Digital Learner Twin. The system adapts entirely to your needs, without you ever lifting a finger.
          </p>

          <p className="text-sm text-white/40 font-light -mt-4 hidden lg:block">
            Hover the constellation to inspect live signal weights.
          </p>

          <div className="flex flex-col gap-6 mt-2">
            {signals.map((sig) => (
              <div key={sig.title} className="flex gap-4 items-start">
                <div className="p-2 rounded-lg bg-white/5 border border-white/10 shrink-0 mt-1">{sig.icon}</div>
                <div>
                  <h4 className="text-white font-semibold text-base mb-1">{sig.title}</h4>
                  <p className="text-[var(--text-secondary)] text-sm font-light leading-relaxed">{sig.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <LearnerTwinVisualization />
      </div>
    </GatewaySection>
  );
}
