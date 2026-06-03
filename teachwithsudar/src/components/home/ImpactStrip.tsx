"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const stats = [
  {
    value: 7,
    suffix: "",
    label: "Modalities",
    desc: "Text, Video, Audio, MindMap, Flashcards, Feed, Play",
  },
  {
    value: 30,
    suffix: "+",
    label: "Languages",
    desc: "Full-stack localization & multilingual TTS",
  },
  {
    value: 14,
    suffix: "",
    label: "Visual Templates",
    desc: "Beautiful, pedagogically sound styles",
  },
  {
    value: 100,
    suffix: "%",
    label: "Adaptive",
    desc: "Real-time Next-Best-Action engine",
  },
];

export function ImpactStrip() {
  const containerRef = useRef<HTMLDivElement>(null);
  const counterRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    counterRefs.current.forEach((ref, idx) => {
      if (!ref) return;

      const stat = stats[idx];
      const obj = { val: 0 };

      gsap.to(obj, {
        val: stat.value,
        duration: 2,
        ease: "power3.out",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 85%",
          toggleActions: "play none none reverse",
        },
        onUpdate: () => {
          ref.innerText = Math.floor(obj.val).toString();
        },
      });
    });
  }, []);

  return (
    <section
      ref={containerRef}
      className="relative z-10 py-16 bg-[#050505] border-y border-white/5 backdrop-blur-md overflow-hidden"
    >
      <div className="absolute inset-0 pointer-events-none opacity-30">
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-20 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-3/4 -translate-y-1/2 w-96 h-20 bg-violet-500/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-content-wide mx-auto px-6 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 items-center text-center mb-14">
          {stats.map((stat, idx) => (
            <div key={stat.label} className="flex flex-col gap-2">
              <div className="text-4xl md:text-6xl font-black text-white font-bricolage tracking-tight flex items-center justify-center">
                <span
                  ref={(el) => {
                    counterRefs.current[idx] = el;
                  }}
                >
                  0
                </span>
                <span className="text-primary">{stat.suffix}</span>
              </div>
              <div className="text-sm font-semibold text-white/90 font-mono tracking-wider uppercase">
                {stat.label}
              </div>
              <div className="text-xs text-foreground-muted font-light max-w-[180px] mx-auto leading-relaxed">
                {stat.desc}
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <blockquote className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 text-left">
            <p className="text-sm text-white/80 font-light leading-relaxed italic">
              &ldquo;Sudar finally feels like a learning OS—not another LMS bolt-on. Our team ships courses in Studio and learners switch modalities without us rebuilding content.&rdquo;
            </p>
            <footer className="mt-4 text-[11px] font-mono text-foreground-muted uppercase tracking-wider">
              L&amp;D Lead · Enterprise pilot
            </footer>
          </blockquote>
          <blockquote className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 text-left">
            <p className="text-sm text-white/80 font-light leading-relaxed italic">
              &ldquo;The tutor remembers context across sessions. That longitudinal memory is the difference between a chatbot and a study buddy.&rdquo;
            </p>
            <footer className="mt-4 text-[11px] font-mono text-foreground-muted uppercase tracking-wider">
              Instructional designer · Higher ed
            </footer>
          </blockquote>
        </div>
      </div>
    </section>
  );
}
