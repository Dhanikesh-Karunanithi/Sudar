"use client";

import * as React from "react";
import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ModalityPreviewPanel, type ModalityPreviewId, type ModalityPreviewMode } from "./ModalityPreviewPanel";

const modes: Array<ModalityPreviewMode & { icon: React.ReactNode }> = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
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
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
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
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
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
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
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
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z" />
      </svg>
    ),
    id: "Flashcards",
    name: "Flashcards",
    tag: "Spaced Repetition",
    desc: "Adaptive recall sessions. Spaced repetition scheduling fights the Ebbinghaus forgetting curve.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 8.25h3m-3 2.25h3m-3 2.25h3M3 12h.008v.008H3V12zm0 2.25h.008v.008H3v-.008zm0 2.25h.008v.008H3V16.5z" />
      </svg>
    ),
    id: "SudarFeed",
    name: "SudarFeed",
    tag: "Microlearning",
    desc: "Short vertical clips in a scrollable feed. Useful when learners want small chunks instead of a long module.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 6.087c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.036-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959v0a.64.64 0 01-.657.643 48.39 48.39 0 01-4.163-.3c.186 1.613.293 3.25.315 4.907a.656.656 0 01-.658.663v0c-.355 0-.676-.186-.959-.401a1.647 1.647 0 00-1.003-.349c-1.036 0-1.875 1.007-1.875 2.25s.84 2.25 1.875 2.25c.369 0 .713-.128 1.003-.349.283-.215.604-.401.959-.401v0c.31 0 .555.26.532.57a48.039 48.039 0 01-.642 5.056c1.518.19 3.058.309 4.616.354a.64.64 0 00.657-.643v0c0-.355-.186-.676-.401-.959a1.647 1.647 0 01-.349-1.003c0-1.035 1.008-1.875 2.25-1.875 1.243 0 2.25.84 2.25 1.875 0 .369-.128.713-.349 1.003-.215.283-.4.604-.4.959v0c0 .333.277.599.61.58a48.1 48.1 0 005.427-.63 48.05 48.05 0 00.582-4.717.532.532 0 00-.533-.57v0c-.355 0-.676.186-.959.401-.29.221-.634.349-1.003.349-1.035 0-1.875-1.007-1.875-2.25s.84-2.25 1.875-2.25c.37 0 .713.128 1.003.349.283.215.604.4.959.4v0a.656.656 0 00.658-.663 48.422 48.422 0 00-.37-5.36c-1.886.342-3.81.574-5.766.689a.578.578 0 01-.61-.58v0z" />
      </svg>
    ),
    id: "SudarPlay",
    name: "SudarPlay",
    tag: "Gamified",
    desc: "Interactive scenario-based games. Applied learning in context. High retention, high engagement.",
  },
];

export function ModalitiesOrbit() {
  const sectionRef = useRef<HTMLElement>(null);
  const orbitRef = useRef<HTMLDivElement>(null);
  const [hoveredId, setHoveredId] = React.useState<ModalityPreviewId | null>(null);
  const [activeId, setActiveId] = React.useState<ModalityPreviewId | null>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const orbit = orbitRef.current;
    if (!orbit) return;

    const nodes = orbit.querySelectorAll("[data-modality-node]");
    gsap.set(nodes, { opacity: 0 });
    gsap.to(nodes, {
      opacity: 1,
      duration: 0.55,
      stagger: 0.08,
      ease: "power2.out",
      scrollTrigger: {
        trigger: sectionRef.current,
        start: "top 70%",
        toggleActions: "play none none reverse",
      },
    });
  }, []);

  const activeMode = React.useMemo(() => {
    if (!activeId) return null;
    return modes.find((m) => m.id === activeId) || null;
  }, [activeId]);

  const hoveredMode = React.useMemo(() => {
    if (!hoveredId) return null;
    return modes.find((m) => m.id === hoveredId) || null;
  }, [hoveredId]);

  const radius = 180; // Orbit radius in px

  return (
    <section ref={sectionRef} className="relative z-10 py-24 md:py-36 bg-[#050505] border-t border-white/5 overflow-hidden">
      <div className="max-w-content-wide mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-16 max-w-2xl mx-auto">
          <span className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs text-primary font-mono tracking-wider uppercase">
            Multimodal Delivery
          </span>
          <h2 className="mt-6 text-4xl md:text-6xl font-black text-white font-bricolage tracking-tight leading-tight">
            One course. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-violet-500 italic font-serif font-light">
              Seven modalities.
            </span>
          </h2>
          <p className="mt-4 text-foreground-muted font-light leading-relaxed">
            Write the content once in Studio. Intelligence automatically renders the same material across seven distinct formats. Hover and click to preview.
          </p>
        </div>

        {/* Interactive Orbit (Desktop) */}
        <div className="hidden md:grid grid-cols-12 gap-12 items-center min-h-[500px]">
          {/* Left: Orbit Ring */}
          <div ref={orbitRef} className="col-span-7 flex justify-center items-center relative h-[500px]">
            {/* Central Hub */}
            <div className="absolute w-32 h-32 rounded-full bg-gradient-to-br from-primary/20 to-violet-500/20 border border-white/10 flex flex-col items-center justify-center backdrop-blur-md z-10 shadow-[0_0_50px_rgba(255,69,0,0.15)]">
              <span className="text-[10px] font-mono tracking-widest text-primary font-bold">SUDAR</span>
              <span className="text-[11px] text-white/60 font-light mt-1">Intelligence</span>
            </div>

            {/* Orbit Circle SVG Line */}
            <svg className="absolute w-[360px] h-[360px] pointer-events-none opacity-20">
              <circle cx="180" cy="180" r={radius} fill="none" stroke="white" strokeWidth="1" strokeDasharray="4 4" />
            </svg>

            {/* Orbital Nodes */}
            {modes.map((mode, idx) => {
              const angle = (idx * 2 * Math.PI) / modes.length - Math.PI / 2;
              const x = Math.cos(angle) * radius;
              const y = Math.sin(angle) * radius;

              const isHovered = hoveredId === mode.id;
              const isAnyHovered = hoveredId !== null;

              return (
                <button
                  key={mode.id}
                  data-modality-node
                  onMouseEnter={() => setHoveredId(mode.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onClick={() => setActiveId(mode.id)}
                  className="absolute p-4 rounded-full bg-black/60 border border-white/10 hover:border-primary/40 hover:bg-black transition-all duration-300 z-20 flex items-center justify-center group modality-orbit-node"
                  style={{
                    transform: `translate(${x}px, ${y}px) scale(${isHovered ? 1.25 : 1})`,
                    opacity: isAnyHovered && !isHovered ? 0.4 : 1,
                    boxShadow: isHovered ? "0 0 25px rgba(255, 69, 0, 0.25)" : "none",
                  }}
                >
                  <div className={`text-white transition-colors duration-300 ${isHovered ? 'text-primary' : 'group-hover:text-primary'}`}>
                    {mode.icon}
                  </div>

                  {/* Tooltip */}
                  <span className="absolute -bottom-8 bg-black/80 border border-white/5 text-[10px] font-mono text-white/80 px-2.5 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap">
                    {mode.name}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Right: Dynamic Info Panel */}
          <div className="col-span-5 h-[320px] flex flex-col justify-center border border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent backdrop-blur-sm rounded-3xl p-8 relative overflow-hidden">
            <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-primary/5 rounded-full blur-3xl" />

            <AnimatePresence mode="wait">
              {hoveredMode ? (
                <motion.div
                  key={hoveredMode.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.25 }}
                  className="flex flex-col gap-4"
                >
                  <span className="text-xs font-mono tracking-widest text-primary uppercase font-bold">
                    {hoveredMode.tag}
                  </span>
                  <h3 className="text-3xl font-black text-white font-bricolage tracking-tight">
                    {hoveredMode.name} Modality
                  </h3>
                  <p className="text-foreground-muted font-light leading-relaxed">
                    {hoveredMode.desc}
                  </p>
                  <div className="mt-2">
                    <span className="text-xs text-white/40 font-mono">Click node to open live interactive preview</span>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="default"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col gap-4 text-center items-center"
                >
                  <div className="w-12 h-12 rounded-full border border-dashed border-white/20 flex items-center justify-center text-white/40 animate-spin" style={{ animationDuration: "10s" }}>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-white font-bricolage">Explore Modalities</h3>
                  <p className="text-foreground-muted text-sm font-light max-w-sm">
                    Hover over any orbital node on the left to inspect its pedagogical purpose and click to see it in action.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Grid Layout (Mobile) */}
        <div className="grid md:hidden grid-cols-1 sm:grid-cols-2 gap-4">
          {modes.map((mode) => (
            <button
              key={mode.id}
              onClick={() => setActiveId(mode.id)}
              className="flex flex-col gap-4 p-6 rounded-2xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] hover:border-primary/20 transition-all duration-300 text-left"
            >
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-primary w-fit">
                {mode.icon}
              </div>
              <div>
                <span className="text-[10px] font-mono tracking-wider text-primary uppercase font-bold">{mode.tag}</span>
                <h3 className="text-xl font-bold text-white font-bricolage mt-1">{mode.name}</h3>
                <p className="text-foreground-muted text-sm font-light leading-relaxed mt-2">{mode.desc}</p>
              </div>
              <div className="mt-auto pt-4 text-xs text-primary font-mono flex items-center gap-2">
                Launch Preview
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Full Screen Live Preview Modal */}
      <ModalityPreviewPanel active={activeMode} onClose={() => setActiveId(null)} />
    </section>
  );
}
