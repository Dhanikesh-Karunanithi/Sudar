"use client";

import * as React from "react";
import { GatewayHeadline } from "@/components/gateway/GatewayHeadline";
import { GatewaySection } from "@/components/gateway/GatewaySection";
import { ModalityPreviewPanel, type ModalityPreviewId, type ModalityPreviewMode } from "./ModalityPreviewPanel";

const modes: Array<ModalityPreviewMode & { icon: React.ReactNode }> = [
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
    id: "Text",
    name: "Text",
    tag: "Default",
    desc: "Structured long-form reading. Clean typography, section navigation, AI-generated summaries.",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
      </svg>
    ),
    id: "Video",
    name: "Video",
    tag: "Visual",
    desc: "AI-generated narrated video presentations. No filming required. Full captions and transcripts.",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
      </svg>
    ),
    id: "Audio",
    name: "Audio",
    tag: "Auditory",
    desc: "Podcast-style lessons. Natural TTS narration. Ideal for commute learning and accessibility.",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
      </svg>
    ),
    id: "Mind Map",
    name: "Mind Map",
    tag: "Spatial",
    desc: "Visual knowledge architecture. See how concepts connect. Ideal for systems thinkers.",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 6.878V6a2.25 2.25 0 012.25-2.25h7.5A2.25 2.25 0 0118 6v.878m-12 0c.235-.083.487-.128.75-.128h10.5c.263 0 .515.045.75.128m-12 0A2.25 2.25 0 004.5 9v9a2.25 2.25 0 002.25 2.25h10.5A2.25 2.25 0 0019.5 18V9a2.25 2.25 0 00-2.25-2.25m-12 0V9a2.25 2.25 0 012.25-2.25h10.5A2.25 2.25 0 0118 9v.878" />
      </svg>
    ),
    id: "Flashcards",
    name: "Flashcards",
    tag: "Spaced repetition",
    desc: "Adaptive recall sessions. Spaced repetition scheduling fights the forgetting curve.",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
      </svg>
    ),
    id: "SudarFeed",
    name: "SudarFeed",
    tag: "Microlearning",
    desc: "Short vertical clips in a scrollable feed for learners who want smaller chunks.",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 6.087c0-.355.186-.676.401-.959.214-.282.334-.618.334-.959 0-.682-.518-1.234-1.156-1.234H9.75M9.75 6.75h4.5M9.75 6.75v10.5M9.75 17.25h4.5m0-10.5v10.5m0-10.5h1.5m-1.5 10.5h1.5" />
      </svg>
    ),
    id: "SudarPlay",
    name: "SudarPlay",
    tag: "Gamified",
    desc: "Interactive scenario-based games. Applied learning in context.",
  },
];

export function ModalitiesOrbit() {
  const [activeId, setActiveId] = React.useState<ModalityPreviewId | null>(null);
  const [selectedId, setSelectedId] = React.useState<ModalityPreviewId>("Text");

  const selected = modes.find((m) => m.id === selectedId) ?? modes[0];
  const activeMode = activeId ? modes.find((m) => m.id === activeId) ?? null : null;

  return (
    <GatewaySection id="modalities">
      <GatewayHeadline
        align="center"
        badge="Multimodal delivery"
        accent="Seven modalities."
        accentStyle="word"
        accentOnNewLine
        subtitle="Write once in Studio. Intelligence renders the same material across seven formats—select one to preview."
      >
        One course.
      </GatewayHeadline>

      <div className="mt-14 grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-3 content-start">
          {modes.map((mode) => {
            const isSelected = selectedId === mode.id;
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => setSelectedId(mode.id)}
                className={`flex flex-col gap-2 p-4 rounded-xl border text-left transition-colors ${
                  isSelected
                    ? "border-[var(--brand-accent)]/50 bg-[var(--brand-accent)]/10"
                    : "border-[var(--border)] bg-[var(--surface-elevated)] hover:border-brand-secondary/40"
                }`}
              >
                <span className={isSelected ? "text-[var(--brand-accent)]" : "text-brand-secondary"}>
                  {mode.icon}
                </span>
                <span className="text-sm font-heading font-semibold text-[var(--text-primary)]">
                  {mode.name}
                </span>
                <span className="text-[10px] uppercase tracking-wider text-[var(--text-secondary)]">
                  {mode.tag}
                </span>
              </button>
            );
          })}
        </div>

        <div className="lg:col-span-7 rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-8 flex flex-col gap-5 min-h-[280px]">
          <span className="text-xs font-medium uppercase tracking-wider text-[var(--brand-accent)]">
            {selected.tag}
          </span>
          <h3 className="text-2xl md:text-3xl font-heading font-bold text-[var(--text-primary)]">
            {selected.name}
          </h3>
          <p className="text-[var(--text-secondary)] leading-relaxed flex-1">{selected.desc}</p>
          <button
            type="button"
            onClick={() => setActiveId(selected.id)}
            className="w-fit text-sm font-semibold text-[var(--brand-accent)] hover:underline"
          >
            Launch interactive preview →
          </button>
        </div>
      </div>

      <ModalityPreviewPanel active={activeMode} onClose={() => setActiveId(null)} />
    </GatewaySection>
  );
}
